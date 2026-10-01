// Speech recognition & synthesis helper for ChatGPT voice features

export class SpeechAssistant {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking = false;

  public static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop any ongoing speech

    // Strip markdown formatting before speaking
    const plainText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/[*_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.isSpeaking = true;
    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public static startListening(
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): { stop: () => void } | null {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition not supported in this browser.');
      return null;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionConstructor();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        onError(event.error || 'Speech recognition error');
      };

      rec.onend = () => {
        onEnd();
      };

      rec.start();
      this.recognition = rec;

      return {
        stop: () => {
          try {
            rec.stop();
          } catch {}
        },
      };
    } catch (e: any) {
      onError(e?.message || 'Failed to start voice input');
      return null;
    }
  }
}
