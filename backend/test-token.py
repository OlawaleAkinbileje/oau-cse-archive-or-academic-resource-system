
from jose import jwt
import os
from dotenv import load_dotenv

# Load the environment variables
load_dotenv()

print("Supabase JWT Secret from env:", os.getenv("SUPABASE_JWT_SECRET")[:50] if os.getenv("SUPABASE_JWT_SECRET") else "NOT FOUND")

# Let's test with a dummy token or your actual token
# Replace this with your actual token from localStorage!
test_token = input("Enter your access token: ").strip()

print("\n--- Trying to decode without signature ---")
try:
    payload_no_verify = jwt.decode(test_token, options={"verify_signature": False})
    print("SUCCESS! Payload:", payload_no_verify)
except Exception as e:
    print("ERROR decoding without signature:", e)
    import traceback
    traceback.print_exc()

print("\n--- Trying to decode with HS256 ---")
try:
    payload_hs256 = jwt.decode(test_token, os.getenv("SUPABASE_JWT_SECRET"), algorithms=["HS256"], options={"verify_aud": False})
    print("SUCCESS with HS256! Payload:", payload_hs256)
except Exception as e:
    print("ERROR with HS256:", e)
    import traceback
    traceback.print_exc()

print("\n--- Trying to decode with HS512 ---")
try:
    payload_hs512 = jwt.decode(test_token, os.getenv("SUPABASE_JWT_SECRET"), algorithms=["HS512"], options={"verify_aud": False})
    print("SUCCESS with HS512! Payload:", payload_hs512)
except Exception as e:
    print("ERROR with HS512:", e)
    import traceback
    traceback.print_exc()

print("\n--- Trying to decode with RS256 ---")
try:
    payload_rs256 = jwt.decode(test_token, os.getenv("SUPABASE_JWT_SECRET"), algorithms=["RS256"], options={"verify_aud": False})
    print("SUCCESS with RS256! Payload:", payload_rs256)
except Exception as e:
    print("ERROR with RS256:", e)
    import traceback
    traceback.print_exc()

print("\n--- Trying to decode with ES256 ---")
try:
    payload_es256 = jwt.decode(test_token, os.getenv("SUPABASE_JWT_SECRET"), algorithms=["ES256"], options={"verify_aud": False})
    print("SUCCESS with ES256! Payload:", payload_es256)
except Exception as e:
    print("ERROR with ES256:", e)
    import traceback
    traceback.print_exc()

