import io
import json
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from server.app import create_app
from server.security import ApiGuard

TOKEN = 'a' * 43  # Test fixture, never a deployment credential.


class SecurityTests(unittest.TestCase):
    def test_missing_secret_fails_before_loading_engine(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                create_app()

    def test_authentication_and_client_identity(self):
        guard = ApiGuard(TOKEN)
        for value in ('', 'Bearer wrong', 'Bearer ' + TOKEN + 'x'):
            self.assertEqual(guard.check({'HTTP_AUTHORIZATION':value})[0], '401 Unauthorized')
        self.assertEqual(guard.check({'HTTP_AUTHORIZATION':'Bearer '+TOKEN})[0], '400 Bad Request')

    def test_window_and_global_limit(self):
        now = [0]
        guard = ApiGuard(TOKEN, clock=lambda:now[0])
        def call(n):
            return guard.check({'HTTP_AUTHORIZATION':'Bearer '+TOKEN,'HTTP_X_SAJU_CLIENT_ID':f'{n:064x}'})
        for _ in range(6):
            self.assertIsNone(call(0))
        self.assertEqual(call(0)[0], '429 Too Many Requests')
        for n in range(1,25):
            self.assertIsNone(call(n))
        self.assertEqual(call(99)[0], '429 Too Many Requests')
        now[0] = 60
        self.assertIsNone(call(0))

    def test_concurrent_requests_cannot_bypass_limit(self):
        guard = ApiGuard(TOKEN)
        env = {'HTTP_AUTHORIZATION':'Bearer '+TOKEN,'HTTP_X_SAJU_CLIENT_ID':'0'*64}
        with ThreadPoolExecutor(max_workers=16) as pool:
            results = list(pool.map(lambda _:guard.check(env), range(40)))
        self.assertEqual(results.count(None),6)

    def test_unauthorized_body_is_not_read_or_calculated(self):
        class Engine:
            identity = {'buildId':'test'}
            def analyze(self, request):
                return {'status':'ok','request':request}
        with patch.dict(os.environ, {'SAJU_API_TOKEN':TOKEN}):
            app = create_app(Engine())
        env = {'PATH_INFO':'/api/saju/v1/analyze','REQUEST_METHOD':'POST'}
        statuses=[]
        result=app(env,lambda status,headers:statuses.append(status))
        self.assertEqual(statuses[-1],'401 Unauthorized')
        self.assertNotIn(TOKEN,b''.join(result).decode())
        env.update(HTTP_AUTHORIZATION='Bearer '+TOKEN,HTTP_X_SAJU_CLIENT_ID='0'*64,
                   CONTENT_TYPE='application/json',CONTENT_LENGTH='2',**{'wsgi.input':io.BytesIO(b'{}')})
        result=app(env,lambda status,headers:statuses.append(status))
        self.assertEqual(statuses[-1],'200 OK')
        self.assertEqual(json.loads(b''.join(result))['request'],{})


if __name__ == '__main__':
    unittest.main()
