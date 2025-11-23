/**
 * Sound utility functions for notifications and messages
 * Uses Web Audio API to generate sounds programmatically
 */

// Play notification sound (bell-like chime)
export const playNotificationSound = (enabled = true, volume = 0.7) => {
  if (!enabled || typeof window === "undefined") return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a pleasant bell-like sound with multiple frequencies
    const frequencies = [800, 1000, 1200];
    const oscillators = [];
    const gainNodes = [];
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = "sine";
      
      const delay = index * 0.05;
      const duration = 0.3;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(
        (volume * 0.2) / frequencies.length,
        audioContext.currentTime + delay + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + delay + duration
      );
      
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + duration);
      
      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    });
  } catch (error) {
    console.log("Error playing notification sound:", error);
  }
};

// Play message sound (soft pop)
export const playMessageSound = (enabled = true, volume = 0.7) => {
  if (!enabled || typeof window === "undefined") return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Soft pop sound
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.15, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (error) {
    console.log("Error playing message sound:", error);
  }
};

