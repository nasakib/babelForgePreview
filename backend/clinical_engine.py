import os
import json
from google.cloud import pubsub_v1

# Vector Core Clinical Topics
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'spotlight-local-4whxz')
CLINICAL_SUBSCRIPTION_NAME = 'clinical-neuro-streams-sub'

def generate_clinical_report(safe_payload):
    """
    Consumes curated, permission-gated ecosystem data from Mycos to generate
    reports for neuroscience clinicians.
    """
    geohash = safe_payload.get('geohash')
    harmony_score = safe_payload.get('harmony_score')
    vibe = safe_payload.get('vibe')
    
    print(f"\n======================================")
    print(f"🧠 [BabelForge Clinical Engine] NEW REPORT")
    print(f"======================================")
    print(f"Location Vector: {geohash}")
    print(f"Population Harmony: {harmony_score:.2f}")
    print(f"Dominant Neuro-Vibe: {vibe}")
    
    if 'biometric_stream' in safe_payload:
        bio = safe_payload['biometric_stream']
        print(f"\n[Extended Telemetry - User Opt-In]")
        print(f"HRV Baseline: {bio.get('mock_baseline_hrv')} ms")
        print(f"GSR Baseline: {bio.get('mock_baseline_gsr')} µS")
        if bio.get('status') == 'pending_hardware':
            print(f"(Note: Wearable hardware stream is pending SDK finalization)")
    elif 'business_intent' in safe_payload:
        print(f"\n[Commercial Topology]")
        print(f"Intent: {safe_payload.get('business_intent')}")
    else:
        print(f"\n[Standard Telemetry]")
        print(f"User biometric streams are locked due to privacy permissions.")
        
    print(f"======================================\n")

def callback(message):
    try:
        safe_payload = json.loads(message.data.decode('utf-8'))
        generate_clinical_report(safe_payload)
    except Exception as e:
        print(f"[BabelForge Error] Failed to process clinical stream: {e}")
    finally:
        message.ack()

def start_clinical_engine():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(PROJECT_ID, CLINICAL_SUBSCRIPTION_NAME)
    
    print(f"BabelForge Clinical Engine initializing...")
    print(f"Listening for highly-curated neuro-streams on {subscription_path} (Routed via Mycos)")
    
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

if __name__ == '__main__':
    start_clinical_engine()
