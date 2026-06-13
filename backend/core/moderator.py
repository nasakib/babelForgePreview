import re
import numpy as np

class EdgeModerator:
    """
    A lightweight, regex/heuristic based text classifier for edge moderation.
    Designed to intercept obvious toxic, spammy, or low-harmony shoutouts locally
    before they are broadcast to the Connectome.
    """
    
    def __init__(self):
        # Extremely lightweight token list for "edge" filtering
        self.toxic_tokens = set([
            "spam", "buy now", "click here", "free money", "crypto pump",
            "idiot", "hate", "loser", "scam"
        ])
        
        self.spam_patterns = [
            re.compile(r'\b(http|https)://[^\s]+\b'), # Links are often spam in ephemeral shoutouts
            re.compile(r'\b\d{10}\b'), # Phone numbers
            re.compile(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', re.IGNORECASE) # Emails
        ]

    def analyze_shoutout(self, text: str) -> dict:
        """
        Analyzes the text and returns a moderation payload.
        Returns:
            dict: {
                "is_approved": bool,
                "confidence": float,
                "flags": list[str]
            }
        """
        text_lower = text.lower()
        flags = []
        
        # 1. Token Match
        words = set(re.findall(r'\b\w+\b', text_lower))
        toxic_matches = words.intersection(self.toxic_tokens)
        if toxic_matches:
            flags.append(f"toxic_tokens: {', '.join(toxic_matches)}")
            
        # 2. Pattern Match
        for pattern in self.spam_patterns:
            if pattern.search(text):
                flags.append("spam_pattern_detected")
                
        # 3. Harmony Heuristic (e.g. all caps = shouting = low harmony)
        if len(text) > 10 and sum(1 for c in text if c.isupper()) / len(text) > 0.5:
            flags.append("excessive_capitalization")
            
        is_approved = len(flags) == 0
        confidence = 1.0 if is_approved else 0.8 # Mock confidence for heuristic
        
        return {
            "is_approved": is_approved,
            "confidence": confidence,
            "flags": flags
        }

# Singleton instance
moderator = EdgeModerator()
