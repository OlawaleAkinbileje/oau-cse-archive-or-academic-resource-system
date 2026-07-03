import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.supabase_client import get_supabase_client


def test_storage():
    print("=== Testing Supabase Storage ===")
    print("Settings loaded:")
    print(f"  SUPABASE_URL: {settings.supabase_url}")
    print(f"  SUPABASE_STORAGE_BUCKET: {settings.supabase_storage_bucket}")
    print()

    try:
        supabase = get_supabase_client()
        print("✓ Supabase client created successfully!")

        print("\n=== Listing Buckets ===")
        buckets = supabase.storage.list_buckets()
        print(f"Found {len(buckets)} buckets:")
        for bucket in buckets:
            # Check if bucket is dict or object
            if isinstance(bucket, dict):
                print(f"  • {bucket.get('name')} (public: {bucket.get('public')})")
            else:
                print(f"  • {bucket.name} (public: {bucket.public})")

        print(f"\n=== Checking Bucket '{settings.supabase_storage_bucket}' ===")
        try:
            bucket = supabase.storage.from_(settings.supabase_storage_bucket)
            files = bucket.list()
            print(f"✓ Bucket '{settings.supabase_storage_bucket}' exists!")
            print(f"  Found {len(files)} items in bucket:")
            for f in files[:20]:
                if isinstance(f, dict):
                    print(f"    • {f.get('name')} (size: {f.get('metadata', {}).get('contentLength', 'unknown')})")
                else:
                    print(f"    • {f.name}")
            if len(files) > 20:
                print(f"    ... and {len(files) - 20} more")
        except Exception as e:
            print(f"✗ Error checking bucket: {type(e).__name__}: {str(e)}")
            import traceback
            print(traceback.format_exc())

    except Exception as e:
        import traceback
        print(f"✗ Error: {type(e).__name__}: {str(e)}")
        print("\nTraceback:")
        print(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    test_storage()
