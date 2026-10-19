#!/usr/bin/env python3
import json
import sys
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', required=True)
    parser.add_argument('--session-id', required=False)
    parser.add_argument('--limit', type=int, default=100)
    args = parser.parse_args()

    try:
        import instaloader
    except ImportError:
        print(json.dumps({"error": "instaloader not installed"}))
        sys.exit(1)

    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        request_timeout=30,
    )

    if args.session_id:
        L.context.session.cookies.set('sessionid', args.session_id, domain='.instagram.com')

    try:
        profile = instaloader.Profile.from_username(L.context, args.username)
        followers = []

        count = 0
        for follower in profile.get_followers():
            if count >= args.limit:
                break
            followers.append({
                "username": follower.username,
                "full_name": follower.full_name,
                "profile_pic_url": follower.profile_pic_url,
            })
            count += 1

        print(json.dumps(followers))
    except instaloader.ProfileNotExistsException:
        print(json.dumps({"error": "ProfileNotExistsException"}))
        sys.exit(1)
    except instaloader.LoginRequiredException:
        print(json.dumps({"error": "LoginRequiredException"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()