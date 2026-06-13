import os
import json
import time
from google.cloud import pubsub_v1

# Import the EdgeModerator
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.moderator import moderator


# Vector Core Connectome Topics
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'spotlight-local-4whxz')
SUBSCRIPTION_NAME = 'local-resource-flows-sub'
PUBLISH_TOPIC_NAME = 'harmonic-state-vectors'

# Moving average state for Harmony Score
recent_volumes = []
MAX_HISTORY = 10

# We simulate the Pharmacological Topology Forge computation here
def compute_harmonic_state(flow_data):
    """
    Ingests local resource flow data (volume, geohash, velocity) and uses
    Graph Neural Networks to compute persistence diagrams. 
    Outputs a frequency domain vector (harmonic state) and a harmony_score.
    """
    global recent_volumes
    volume = flow_data.get('volumeUsd', 0)
    
    # Update state
    recent_volumes.append(volume)
    if len(recent_volumes) > MAX_HISTORY:
        recent_volumes.pop(0)
        
    avg_vol = sum(recent_volumes) / len(recent_volumes)
    
    # Map average volume to a harmony score between 0.0 and 1.0
    # High volume = high harmony (simplified heuristic for MVP)
    harmony_score = min(1.0, avg_vol / 100.0)
    # Give it a baseline of 0.2 so it doesn't stay completely dead
    harmony_score = max(0.2, harmony_score)

    # The more volume/activity in a geohash, the higher the frequency state
    harmonic_shift = volume * 0.14  
    
    return {
        "geohash": flow_data.get('geohash'),
        "harmonic_frequency": 432.0 + harmonic_shift,
        "resonance_factor": 0.8 + (volume * 0.01),
        "harmony_score": harmony_score,
        "timestamp": time.time()
    }

def callback(message):
    print(f"[Connectome] Ingested raw resource flow: {message.data}")
    try:
        # Parse incoming vector from Spotlight Local
        flow_data = json.loads(message.data.decode('utf-8'))
        
        # Edge Moderation (if text payload exists)
        text_payload = flow_data.get('text', '')
        if text_payload:
            mod_result = moderator.analyze_shoutout(text_payload)
            
            # Emit telemetry every 10 moderation events
            if moderator.stats["total_processed"] % 10 == 0:
                moderator.emit_telemetry()
                
            if not mod_result['is_approved']:
                print(f"[Moderation] Blocked toxic/spam flow: {mod_result['flags']}")
                message.ack()
                return

        # Pass through the Forge
        harmonic_state = compute_harmonic_state(flow_data)
        print(f"[Forge] Computed Harmonic State: {harmonic_state}")
        
        # Publish to the output topic for Codex Babel
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, PUBLISH_TOPIC_NAME)
        
        data_bytes = json.dumps(harmonic_state).encode('utf-8')
        future = publisher.publish(topic_path, data=data_bytes)
        print(f"[Connectome] Emitted harmonic state vector: {future.result()}")
        
    except Exception as e:
        print(f"[Error] Failed to process vector: {e}")
    finally:
        message.ack()

def listen_to_connectome():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_NAME)
    
    print(f"Listening for topological data on {subscription_path}...\n")
    
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()

if __name__ == '__main__':
    listen_to_connectome()
