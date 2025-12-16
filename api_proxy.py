#!/usr/bin/env python3
"""
AI API 代理服务
解决前端直接调用豆包API的CORS跨域问题
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # 允许所有跨域请求

# 默认配置
DEFAULT_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat_proxy():
    """代理转发聊天请求到豆包API"""
    
    # 处理预检请求
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key, X-API-Endpoint'
        return response
    
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 获取API配置（从请求头或使用默认值）
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
        api_endpoint = request.headers.get('X-API-Endpoint') or DEFAULT_ENDPOINT
        
        if not api_key:
            return jsonify({'error': 'API密钥未提供'}), 401
        
        # 转发请求到豆包API
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        print(f"[Proxy] 转发请求到: {api_endpoint}")
        print(f"[Proxy] 模型: {data.get('model', 'unknown')}")
        
        response = requests.post(
            api_endpoint,
            headers=headers,
            json=data,
            timeout=120
        )
        
        # 返回响应
        result = response.json()
        
        if response.status_code != 200:
            print(f"[Proxy] API错误: {response.status_code} - {result}")
            return jsonify(result), response.status_code
        
        return jsonify(result)
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'API请求超时'}), 504
    except requests.exceptions.RequestException as e:
        print(f"[Proxy] 请求错误: {e}")
        return jsonify({'error': f'请求失败: {str(e)}'}), 502
    except Exception as e:
        print(f"[Proxy] 服务器错误: {e}")
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'ok', 'service': 'AI API Proxy'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 AI API 代理服务启动于端口 {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
