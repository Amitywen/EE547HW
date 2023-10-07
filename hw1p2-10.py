import http.server
import json
import os
from urllib.parse import urlparse, parse_qs
import time

class MyHandler(http.server.BaseHTTPRequestHandler):
    req_count = 0
    err_count = 0

    def do_GET(self):
        MyHandler.req_count += 1  # Increment req_count by 1
        parsed_path = urlparse(self.path)
        query = parse_qs(parsed_path.query)

        if parsed_path.path == '/ping':
            self.send_response(204)
            self.end_headers()

        elif parsed_path.path == '/anagram':
            if 'p' not in query or not query['p'][0]:
                self.send_response(400)
                self.end_headers()
                MyHandler.err_count += 1
            else:
                p = query['p'][0]
                if not self.is_valid_string(p):
                    self.send_response(400)
                    self.end_headers()
                    MyHandler.err_count += 1
                else:
                    anagram_count = self.calculate_anagrams(p)
                    response_body = json.dumps({
                        "p": p,
                        "total": str(anagram_count) # change to string
                    })
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", len(response_body))
                    self.end_headers()
                    self.wfile.write(response_body.encode())

        elif parsed_path.path == '/secret':
            if os.path.exists('/tmp/secret.key'):
                with open('/tmp/secret.key', 'r') as f:
                    secret = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.send_header("Content-Length", len(secret))
                self.end_headers()
                self.wfile.write(secret.encode())
            else:
                self.send_response(404)
                self.end_headers()
                MyHandler.err_count += 1

        elif parsed_path.path == '/status':
            response_body = json.dumps({
                "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "req": MyHandler.req_count,
                "err": MyHandler.err_count,
            })
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Content-Length', len(response_body))
            self.end_headers()
            self.wfile.write(response_body.encode('utf-8'))
        
        else:
            self.send_response(404)
            self.end_headers()
            MyHandler.err_count += 1

    def is_valid_string(self, s):
        return s.isalpha() and len(s) > 0
    
    def factorial(n):
        result = 1
        for i in range(1, n + 1):
            result *= i
        return result

    def calculate_anagrams(self, s):
        s = s.lower()
        hist = [0] * 26
        for letter in s:
            index = ord(letter) - ord('a')
            hist[index] += 1

        total_permutations = MyHandler.factorial(len(s))
        for count in hist:
            total_permutations //= MyHandler.factorial(count)
        
        return total_permutations
    

server_address = ('localhost', 8088) 
httpd = http.server.HTTPServer(server_address, MyHandler)
httpd.serve_forever()
