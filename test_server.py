#!/usr/bin/env python3

from http.server import SimpleHTTPRequestHandler, test
import argparse


class InlineHandler(SimpleHTTPRequestHandler):

    def end_headers(self):
        mimetype = self.guess_type(self.path)
        is_file = not self.path.endswith('/')
        # This part adds extra headers for some file types.
        print(mimetype)
        if is_file and mimetype in ['text/plain', 'application/octet-stream']:
            self.send_header('Content-Type', 'text/html')
            # self.send_header('Content-Disposition', 'inline')
        super().end_headers()


# The following is based on the standard library implementation
# https://github.com/python/cpython/blob/3.6/Lib/http/server.py#L1195
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--bind',
        '-b',
        default='',
        metavar='ADDRESS',
        help='Specify alternate bind address [default: all interfaces]'
    )
    parser.add_argument(
        '--port',
        '-p',
        action='store',
        default=8000,
        type=int,
        nargs='?',
        help='Specify alternate port [default: 8000]'
    )
    args = parser.parse_args()
    test(InlineHandler, port=args.port, bind=args.bind)
