#!/usr/bin/env python3
"""
YouTube Music Radio Fetcher (Authenticated Version)
Uses headers_auth.json for improved playlist generation
"""

import sys
import json
import os
import traceback
from ytmusicapi import YTMusic

def fetch_radio(auth_file, video_id, limit=200):
    try:
        # Try authenticated mode first
        use_auth = os.path.exists(auth_file)
        
        if use_auth:
            # Authenticated mode
            try:
                with open(auth_file, 'r', encoding='utf-8') as f:
                    headers = json.load(f)
            except Exception as e:
                # If auth file is corrupted, fall back to unauthenticated
                print(f'[YTMusicRadio] ⚠️ Auth file corrupted, using unauthenticated mode: {str(e)}', file=sys.stderr)
                use_auth = False
        else:
            print('[YTMusicRadio] ℹ️ No auth.json found, using unauthenticated mode', file=sys.stderr)
        
        # Initialize YTMusic
        proxies = {
            'http': 'socks5://127.0.0.1:40000',
            'https': 'socks5://127.0.0.1:40000'
        }
        
        if use_auth:
            ytmusic = YTMusic(proxies=proxies)
            ytmusic._headers = headers  # Force inject auth headers
            source_type = 'ytmusicapi_authenticated'
        else:
            # Unauthenticated mode - may have limited results but still works
            ytmusic = YTMusic(proxies=proxies)
            source_type = 'ytmusicapi_unauthenticated'

        # Fetch radio (watch playlist)
        try:
            result = ytmusic.get_watch_playlist(videoId=video_id, limit=int(limit), radio=True)
            tracks = result.get('tracks', [])
        except Exception as e:
             return {
                'success': False,
                'error': f'API Fetch Error: {str(e)}'
            }
        
        # Format output
        formatted = []
        for track in tracks:
            # Safely extract artists
            artists = track.get('artists', [])
            artist_name = artists[0].get('name', 'Unknown') if artists else 'Unknown'
            
            # Extract thumbnail (highest resolution preferred)
            thumbnails = track.get('thumbnail', [])
            thumbnail_url = thumbnails[-1].get('url') if thumbnails else None

            formatted.append({
                'videoId': track.get('videoId'),
                'title': track.get('title', 'Unknown'),
                'artist': artist_name,
                'duration': track.get('duration_seconds', 0),
                'thumbnail': thumbnail_url,
                'isExplicit': track.get('isExplicit', False)
            })
        
        return {
            'success': True,
            'total': len(formatted),
            'tracks': formatted,
            'source': source_type
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'System Error: {str(e)}',
            'traceback': traceback.format_exc()
        }

if __name__ == "__main__":
    # Expect arguments: [script.py, video_id, limit]
    # NOTE: Wrapper passes arguments, but auth_file is internal to this script location
    
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Missing video_id argument'}))
        sys.exit(1)
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    auth_file_path = os.path.join(script_dir, 'auth.json')
    
    target_video_id = sys.argv[1]
    limit_count = sys.argv[2] if len(sys.argv) > 2 else 50
    
    # Run and print JSON
    result_data = fetch_radio(auth_file_path, target_video_id, limit_count)
    print(json.dumps(result_data))
