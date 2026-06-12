import os
import json
import time
from google.cloud import pubsub_v1

# Vector Core Connectome Topics
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'spotlight-local-4whxz')
SUBSCRIPTION_NAME = 'local-resource-flows-sub'
PUBLISH_TOPIC_NAME = 'harmonic-state-vectors'

# We simulate the Pharmacological Topology Forge computation here
def compute_harmonic_state(flow_data):
    """
    Ingests local resource flow data (volume, geohash, velocity) and uses
    Graph Neural Networks to compute persistence diagrams. 
    Outputs a frequency domain vector (harmonic state).
    """
    volume = flow_data.get('volumeUsd', 0)
    # The more volume/activity in a geohash, the higher the frequency state
    harmonic_shift = volume * 0.14  
    
    return {
        "geohash": flow_data.get('geohash'),
        "harmonic_frequency": 432.0 + harmonic_shift,
        "resonance_factor": 0.8 + (volume * 0.01),
        "timestamp": time.time()
    }

def callback(message):
    print(f"[Connectome] Ingested raw resource flow: {message.data}")
    try:
        # Parse incoming vector from Spotlight Local
        flow_data = json.loads(message.data.decode('utf-8'))
        
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
