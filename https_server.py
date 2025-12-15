#!/usr/bin/env python3
"""
简单的HTTPS服务器，用于本地开发
使用自签名证书，浏览器会显示安全警告，需要手动信任
"""
import http.server
import ssl
import os
import subprocess

PORT = 8443

def generate_certificate():
    """生成自签名证书"""
    cert_file = 'server.crt'
    key_file = 'server.key'
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print(f"证书已存在: {cert_file}, {key_file}")
        return cert_file, key_file
    
    print("生成自签名证书...")
    subprocess.run([
        'openssl', 'req', '-new', '-x509', '-keyout', key_file,
        '-out', cert_file, '-days', '365', '-nodes',
        '-subj', '/CN=localhost'
    ])
    
    return cert_file, key_file

def main():
    # 生成证书
    cert_file, key_file = generate_certificate()
    
    # 创建服务器
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    # 配置SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert_file, key_file)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"HTTPS服务器运行在:")
    print(f"  本机: https://localhost:{PORT}")
    print(f"  局域网: https://192.168.1.30:{PORT}")
    print(f"\n注意: 首次访问时浏览器会提示证书不受信任，请选择'继续访问'或'信任证书'")
    print(f"按 Ctrl+C 停止服务器")
    
    httpd.serve_forever()

if __name__ == '__main__':
    main()

