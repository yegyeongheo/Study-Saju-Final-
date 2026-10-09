import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from wsgiref.simple_server import make_server

from server.app import CoreEngine, LOCK, QuietHandler, ROOT, create_app


class ApiIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = CoreEngine()
        cls.server = make_server('127.0.0.1', 0, create_app(cls.engine, serve_static=True), handler_class=QuietHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'
        cls.sample = json.loads((cls.engine.root / 'outputs/phase0/frozen-package/examples/natal-request.json').read_bytes())

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def call(self, data, headers=None, path='/api/saju/v1/analyze', raw=False):
        body = data if raw else json.dumps(data).encode()
        request = Request(self.url + path, data=body, headers=headers or {'Content-Type':'application/json'})
        try:
            response = urlopen(request, timeout=60)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, json.load(response)

    def original(self, request):
        process = subprocess.run([sys.executable, '-B', str(self.engine.root / 'run_api.py')],
            input=json.dumps(request), capture_output=True, text=True, encoding='utf-8', env=self.engine.env, timeout=30)
        self.assertEqual(process.returncode, 0, process.stderr)
        return json.loads(process.stdout)

    def test_01_every_engine_field_survives_http(self):
        cases = []
        for direction in ('M', 'F'):
            request = copy.deepcopy(self.sample)
            request['subjects'][0]['luckDirectionBasis'] = direction
            cases.append(request)
            timeline = copy.deepcopy(request)
            timeline.update(operation='timeline', period={'startUtc':'2026-01-01T00:00:00Z','endUtc':'2027-01-01T00:00:00Z'})
            cases.append(timeline)
        for birth_time in ({'mode':'branch','value':'子','ziPart':'unspecified'}, {'mode':'unknown'}):
            request = copy.deepcopy(cases[-1])
            request['subjects'][0]['birthTime'] = birth_time
            cases.append(request)
        lunar = copy.deepcopy(self.sample)
        lunar['subjects'][0].update(birthDate='1990-05-12',calendar='lunar',calendarSystem='korean_lunisolar')
        cases.append(lunar)
        leap = copy.deepcopy(lunar)
        leap['subjects'][0].update(birthDate='2023-02-01',isLeapMonth=True)
        cases.append(leap)
        pair = copy.deepcopy(self.sample)
        pair.update(operation='pair', relationType='parentChild')
        pair['subjects'][0]['role'] = 'parent'
        child = copy.deepcopy(pair['subjects'][0])
        child.update(id='B', role='child', birthDate='2015-03-04')
        pair['subjects'].append(child)
        cases.append(pair)
        for request in cases:
            with self.subTest(operation=request['operation'], subject=request['subjects'][0]):
                status, headers, result = self.call(request)
                self.assertEqual(status, 200, result.get('error'))
                self.assertEqual(result, self.original(request))
                self.assertEqual(headers['Cache-Control'], 'no-store')
                self.assertEqual(headers['X-Saju-Build-ID'], LOCK['buildId'])
                candidate = result['result']['subjects'][0]['candidates'][0]
                self.assertTrue({'pillars','features','traits','evidence','structure'} <= candidate.keys())
                self.assertIn('yangRatio', candidate['features']['values'])
                self.assertTrue({'wood','fire','earth','metal','water'} <= candidate['features']['values'].keys())
                if request['operation'] == 'timeline':
                    segments = result['result']['timeline']['data']['segments']
                    self.assertTrue(segments)
                    self.assertTrue(all(s['cycle']['seun']['availability'] == 'AVAILABLE' for s in segments))
                    if request['subjects'][0]['birthTime']['mode'] == 'exact':
                        self.assertTrue(all(s['daeunPillar'] for s in segments))
                    else:
                        self.assertEqual(result['status'], 'partial')
                        self.assertTrue(all(s['daeunUnavailableReason'] == 'BIRTH_TIME_UNCERTAIN' for s in segments))

    def test_02_invalid_inputs_remain_engine_errors(self):
        bad_date = copy.deepcopy(self.sample)
        bad_date['subjects'][0]['birthDate'] = '1990-02-30'
        bad_zone = copy.deepcopy(self.sample)
        bad_zone['subjects'][0]['birthPlace']['ianaTz'] = 'Not/AZone'
        bad_lunar = copy.deepcopy(self.sample)
        bad_lunar['subjects'][0].update(calendar='lunar',calendarSystem='korean_lunisolar',birthDate='2024-02-01',isLeapMonth=True)
        for request in (None, {}, bad_date, bad_zone, bad_lunar):
            with self.subTest(request=request):
                status, _, result = self.call(request)
                self.assertEqual(status, 422)
                self.assertEqual(result, self.original(request))

    def test_03_transport_and_static_boundaries(self):
        for raw in (b'{', b'{"value":NaN}', b'{"value":1e999}', b'{"value":"\\ud800"}', b'['*1100 + b']'*1100, b'\xff'):
            self.assertEqual(self.call(raw, raw=True)[0], 400)
        self.assertEqual(self.call(b'x' * 32769, raw=True)[0], 413)
        self.assertEqual(self.call({}, {'Content-Type':'text/plain'})[0], 415)
        self.assertEqual(self.call({}, {'Content-Type':'application/json','Origin':'https://elsewhere.invalid'})[0], 403)
        self.assertEqual(self.call(self.sample, {'Content-Type':'application/json','Origin':self.url})[0], 200)
        self.assertEqual(self.call({}, path='/api/not-found')[0], 404)
        with urlopen(self.url + '/start.html') as response:
            self.assertIn(b'intake.js', response.read())
        for path in ('/../core-engine.lock.json','/server/app.py','/api/saju/v1/analyze'):
            with self.assertRaises(HTTPError) as context:
                urlopen(self.url + path)
            self.assertIn(context.exception.code, (404,405))
            context.exception.close()
        with urlopen(self.url + '/api/saju/v1/health') as response:
            self.assertEqual(json.load(response)['engine']['sourceManifestSha256'], LOCK['sourceManifestSha256'])

    def test_04_browser_adapter_over_real_http(self):
        result = subprocess.run(['node','tests/http-smoke.mjs'], cwd=ROOT,
            env={**os.environ, 'SAJU_TEST_URL':self.url}, capture_output=True, text=True, encoding='utf-8', timeout=120)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_05_unapproved_manifest_is_rejected(self):
        from unittest.mock import patch
        with patch.dict(os.environ, {'SAJU_EXPECTED_SOURCE_SHA256':'0'*64}):
            with self.assertRaises(RuntimeError):
                CoreEngine()


if __name__ == '__main__':
    unittest.main()
