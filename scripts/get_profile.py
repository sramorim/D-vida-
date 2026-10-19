#!/usr/bin/env python3
import json
import sys
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', required=True)
    parser.add_argument('--session-id', required=False)
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
        post_metadata_txt_pattern='',
        storyitem_metadata_txt_pattern='',
        filename_pattern='{date_utc}_{shortcode}',
        max_connection_attempts=3,
        request_timeout=30,
    )

    if args.session_id:
        L.context.session.cookies.set('sessionid', args.session_id, domain='.instagram.com')

    try:
        profile = instaloader.Profile.from_username(L.context, args.username)
        
        result = {
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "followers": profile.followers,
            "followees": profile.followees,
            "mediacount": profile.mediacount,
            "is_private": profile.is_private,
            "is_verified": profile.is_verified,
            "profile_pic_url": profile.profile_pic_url,
            "external_url": profile.external_url or "",
        }
        print(json.dumps(result))
    except instaloader.ProfileNotExistsException:
        print(json.dumps({"error": "ProfileNotExistsException"}))
        sys.exit(1)
    except instaloader.LoginRequiredException:
        print(json.dumps({"error": "LoginRequiredException"}))
        sys.exit(1)
    except instaloader.TwoFactorAuthRequiredException:
        print(json.dumps({"error": "TwoFactorAuthRequiredException"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()