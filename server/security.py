"""Server-to-server authentication and bounded, process-local throttling."""
from collections import OrderedDict, deque
import hmac
import re
from threading import Lock
from time import monotonic


class ApiGuard:
    def __init__(self, token, *, clock=monotonic):
        if not token or not re.fullmatch(r'[A-Za-z0-9_-]{43,128}', token):
            raise RuntimeError('SAJU_API_TOKEN must be a random URL-safe token of at least 43 characters')
        self.token = token.encode('ascii')
        self.clock = clock
        self.lock = Lock()
        self.total = deque()
        self.clients = OrderedDict()

    def check(self, environ):
        supplied = environ.get('HTTP_AUTHORIZATION', '').encode('utf-8')
        if not hmac.compare_digest(supplied, b'Bearer ' + self.token):
            return '401 Unauthorized', 'UNAUTHORIZED'
        # Set only by the trusted Sites relay, never forwarded from browser headers.
        client = environ.get('HTTP_X_SAJU_CLIENT_ID', '')
        if not re.fullmatch(r'[a-f0-9]{64}', client):
            return '400 Bad Request', 'CLIENT_ID_REQUIRED'
        with self.lock:
            now = self.clock()
            while self.total and self.total[0] <= now - 60:
                self.total.popleft()
            while self.clients:
                first = next(iter(self.clients))
                if self.clients[first][-1] > now - 60:
                    break
                self.clients.popitem(last=False)
            hits = self.clients.get(client, deque())
            while hits and hits[0] <= now - 60:
                hits.popleft()
            if len(self.total) >= 30 or len(hits) >= 6:
                return '429 Too Many Requests', 'RATE_LIMITED'
            hits.append(now)
            self.total.append(now)
            self.clients[client] = hits
            self.clients.move_to_end(client)
        return None
