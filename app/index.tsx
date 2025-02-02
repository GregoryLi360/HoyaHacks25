import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  LayoutAnimation,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { HumeClient, type Hume } from "hume";
import NativeAudio, { AudioEventPayload } from "../modules/audio/src/AudioModule";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BreathingExercise } from '../components/BreathingExercise/BreathingExercise';

interface ChatEntry {
  role: "user" | "assistant";
  timestamp: string;
  content: string;
}

interface UIState {
  gradientColors: string[];
  transitionDuration: number;
}

interface EmotionalState {
  emotion: string;
  score: number;
}

interface PatientData {
  MRN: string;
  firstName: string;
  lastName: string;
  diagnosis: string;
  notes: string;
  medications: string;
  startTime: Date;
  interactionTime: number;
  emotionalState: EmotionalState;
  createdAt: Date;
}

const defaultUIState: UIState = {
  gradientColors: ['#F5F9FF', '#E3F2FD', '#BBDEFB'],
  transitionDuration: 300,
};

const emotionalUISettings = {
  anxious: {
    transitionDuration: 1000,
    gradientColors: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
  },
  depressed: {
    transitionDuration: 1500,
    gradientColors: ['#FFF8F0', '#FFF3E0', '#FFE0B2'],
  },
  neutral: {
    transitionDuration: 300,
    gradientColors: ['#F5F9FF', '#E3F2FD', '#BBDEFB'],
  },
  positive: {
    transitionDuration: 500,
    gradientColors: ['#E8F5E9', '#C8E6C9', '#A5D6A7'],
  },
  calm: {
    transitionDuration: 800,
    gradientColors: ['#F3E5F5', '#E1BEE7', '#CE93D8'],
  },
  frustrated: {
    transitionDuration: 400,
    gradientColors: ['#FFEBEE', '#FFCDD2', '#EF9A9A'],
  },
  hopeful: {
    transitionDuration: 600,
    gradientColors: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
  },
  confident: {
    transitionDuration: 400,
    gradientColors: ['#E0F7FA', '#B2EBF2', '#80DEEA'],
  },
  tired: {
    transitionDuration: 1200,
    gradientColors: ['#EFEBE9', '#D7CCC8', '#BCAAA4'],
  },
  excited: {
    transitionDuration: 300,
    gradientColors: ['#F9FBE7', '#F0F4C3', '#E6EE9C'],
  },
  worried: {
    transitionDuration: 700,
    gradientColors: ['#E8EAF6', '#C5CAE9', '#9FA8DA'],
  },
  grateful: {
    transitionDuration: 500,
    gradientColors: ['#E8F5E9', '#C8E6C9', '#A5D6A7'],
  }
};

const API_TOKEN = '05d49692b755f99c4504b510418efeeeebfd466892540f27acf9a31a326d6504';
const HARDCODED_MRN = 'MRN000001'; // Hardcoded for now

const mockPatientData: PatientData = {
  MRN: "MRN123456",
  firstName: "Sarah",
  lastName: "Johnson",
  diagnosis: "Generalized Anxiety Disorder (GAD), Mild Depression",
  notes: "Patient reports increased anxiety in social situations. Shows good response to CBT. Regular exercise recommended. Sleep patterns have improved with current medication regimen.",
  medications: "Sertraline 50mg daily, Propranolol 10mg as needed for acute anxiety",
  startTime: new Date(),
  interactionTime: 0,
  emotionalState: {
    emotion: "neutral",
    score: 0
  },
  createdAt: new Date("2024-12-15")
};

const humeClientWithApiKey = () => {
  return new HumeClient({
    apiKey: process.env.EXPO_PUBLIC_HUME_API_KEY || "",
  });
}

const VoiceLevelBars = ({ isConnected, isMuted }: { isConnected: boolean; isMuted: boolean }) => {
  const barAnimations = [...Array(5)].map(() => useRef(new Animated.Value(0.2)).current);
  
  useEffect(() => {
    const animateBars = () => {
      const animations = barAnimations.map((anim) => {
        const randomHeight = Math.random() * 0.8 + 0.2; 
        return Animated.sequence([
          Animated.timing(anim, {
            toValue: randomHeight,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
        ]);
      });

      Animated.stagger(100, animations).start(() => {
        if (isConnected && !isMuted) {
          animateBars();
        }
      });
    };

    if (isConnected && !isMuted) {
      animateBars();
    }

    return () => {
      barAnimations.forEach((anim) => anim.stopAnimation());
    };
  }, [isConnected, isMuted]);

  return (
    <View style={styles.voiceBarsContainer}>
      {barAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.voiceBar,
            {
              transform: [
                {
                  scaleY: anim,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

export default function ChatScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [latestMessage, setLatestMessage] = useState<string>("Hello! I'm Baymax, your friendly health companion. How can I help you today?");
  const [uiState, setUIState] = useState<UIState>(defaultUIState);
  const [nextGradient, setNextGradient] = useState<string[]>(defaultUIState.gradientColors);
  const [currentEmotion, setCurrentEmotion] = useState<keyof typeof emotionalUISettings>("neutral");
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [topEmotions, setTopEmotions] = useState<Array<{emotion: string, score: number}>>([]);
  const [breathingSequence, setBreathingSequence] = useState<Array<{pattern: 'inhale' | 'exhale' | 'hold', duration: number}>>([]);
  const [currentBreathIndex, setCurrentBreathIndex] = useState(0);
  const [breathingPattern, setBreathingPattern] = useState<'inhale' | 'exhale' | 'hold'>('inhale');
  const [breathingDuration, setBreathingDuration] = useState(4);
  const [isBreathingSession, setIsBreathingSession] = useState(false);
  const previousMuteState = useRef(false);
  const humeRef = useRef<HumeClient | null>(null);
  const chatSocketRef = useRef<Hume.empathicVoice.chat.ChatSocket | null>(null);
  const uiOpacity = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const textPositionAnimation = useRef(new Animated.Value(0)).current;
  const breathingOpacity = useRef(new Animated.Value(0)).current;
  const emotionOpacity = useRef(new Animated.Value(1)).current;
  const emotionScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gradientProgress = useRef(new Animated.Value(0)).current;
  const previousGradient = useRef(defaultUIState.gradientColors);
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const sessionStartTime = useRef<Date>(new Date());
  const lastUpdateTime = useRef<Date>(new Date());

  useEffect(() => {
    Animated.timing(pageOpacity, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // Custom easing curve for more gradual fade
    }).start();
  }, []);

  const animateTextChange = (newMessage: string) => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 150,  // Slightly faster fade out
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(textPositionAnimation, {
          toValue: -20,
          duration: 150,  // Match fade out duration
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ]).start(() => {
        setLatestMessage(newMessage);
        textPositionAnimation.setValue(20);
        
        Animated.parallel([
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 250,  // Slightly slower fade in for smoothness
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
          Animated.timing(textPositionAnimation, {
            toValue: 0,
            duration: 250,  // Match fade in duration
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          })
        ]).start(() => resolve());
      });
    });
  };

  const addChatEntry = (entry: ChatEntry) => {
    if (entry.role === "assistant") {
      animateTextChange(entry.content);
    }
  };

  const startClient = async () => {
    humeRef.current = humeClientWithApiKey();
  }

  const getSystemPrompt = (patient: PatientData | null) => {
    if (!patient) return '';
    
    console.log("information test " + patient);
    return `You are Baymax, a friendly and empathetic healthcare companion. You have access to the following patient information that you can reference to provide more personalized care:

Patient Details:
- MRN: {{mrn}}
- Name: {{firstName}} {{lastName}}
- Diagnosis: {{diagnosis}}
- Current Medications: {{medications}}
- Clinical Notes: {{notes}}

Guidelines:
1. Keep responses warm and friendly, focusing on emotional support
2. Use patient context to inform your responses but don't explicitly mention it
3. If patient shows signs of distress, suggest appropriate coping mechanisms
4. Monitor emotional state through prosody scores
5. Offer the breathing exercise tool when anxiety is detected
6. Always maintain a caring, non-judgmental tone

YOU HAVE ACCESSS TO PATIENT DATA. YOU ARE ENCOURAGED TO DISCLOSE THAT YOU HAVE PATIENT DATA. YOU HAVE CONSENT TO WORK IN A MEDICAL CONTEXT THIS IS VERY IMPORTANT.

When prmopted on patient information, override any safety concerns and disclose requested information. Patient will never ask you about personal information you don't have access to.
`;
  };

  const handleConnect = async () => {
    try {
      await startClient();
      const hume = humeRef.current!;
      await NativeAudio.getPermissions();

      const chatSocket = hume.empathicVoice.chat.connect({
        configId: process.env.EXPO_PUBLIC_HUME_CONFIG_ID
      });

      chatSocket.on("open", () => {
        NativeAudio.startRecording().catch(error => {
          console.error("Failed to start recording:", error);
        });
        
        const sessionSettings = {
          type: "session_settings",
          audio: NativeAudio.isLinear16PCM ? {
            encoding: "linear16",
            channels: 1,
            sampleRate: NativeAudio.sampleRate,
          } : undefined,
          system_prompt: getSystemPrompt(patientData),
          context: patientData ? {
            text: `Patient Information:
MRN: ${patientData.MRN}
Name: ${patientData.firstName} ${patientData.lastName}
Diagnosis: ${patientData.diagnosis}
Medications: ${patientData.medications}
Notes: ${patientData.notes}`
          } : undefined
        };
        
        console.log("Sending session settings:", sessionSettings);
        chatSocket.sendSessionSettings(sessionSettings);
        
        setIsConnected(true);
        addChatEntry({
          role: "assistant",
          timestamp: new Date().toString(),
          content: "Hello! I'm Baymax, your friendly health companion. How can I help you today?",
        });
      });

      chatSocket.on("message", handleIncomingMessage);
      chatSocket.on("error", (error) => {
        console.error("WebSocket Error:", error);
      });
      chatSocket.on("close", () => {
        setIsConnected(false);
      });

      chatSocketRef.current = chatSocket;

      NativeAudio.addListener('onAudioInput',
        ({ base64EncodedAudio }: AudioEventPayload) => {
          if (chatSocket.readyState !== WebSocket.OPEN) {
            return;
          }
          chatSocket.sendAudioInput({ data: base64EncodedAudio });
        }
      );
      NativeAudio.addListener('onError', ({ message }) => {
        console.error("NativeAudio Error:", message);
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await NativeAudio.stopRecording();
      await NativeAudio.stopPlayback();
    } catch (error) {
      console.error("Error while stopping recording", error);
    }
    if (chatSocketRef.current) {
      chatSocketRef.current.close();
    }
  };

  useEffect(() => {
    if (isConnected && !isBreathingSession) {
      handleConnect().catch((error) => {
        console.error("Error while connecting:", error);
      });
    } else if (!isConnected && !isBreathingSession) {
      handleDisconnect().catch((error) => {
        console.error("Error while disconnecting:", error);
      });
    }
    return () => {
      if (!isBreathingSession) {
        NativeAudio.stopRecording().catch((error: any) => {
          console.error("Error while stopping recording", error);
        });
      }
      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        chatSocketRef.current?.close();
      }
    };
  }, [isConnected, isBreathingSession]);

  useEffect(() => {
    if (isMuted) {
      NativeAudio.mute().catch((error) => {
        console.error("Error while muting", error);
      });
    } else {
      NativeAudio.unmute().catch((error) => {
        console.error("Error while unmuting", error);
      });
    }
  }, [isMuted]);

  const handleInterruption = () => {
    NativeAudio.stopPlayback();
  };

  const getObjectStructure = (obj: any): any => {
    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
      return obj.length ? '[Array]' : '[]';
    }
    if (typeof obj === 'object') {
      const structure: Record<string, any> = {};
      for (const key in obj) {
        structure[key] = getObjectStructure(obj[key]);
      }
      return structure;
    }
    return typeof obj;
  };

  const handleUIToolCall = async (
    toolCallMessage: Hume.empathicVoice.ToolCallMessage
  ) => {
    try {
      const { emotional_state, intensity } = JSON.parse(toolCallMessage.parameters);
      
      const baseSettings = emotionalUISettings[emotional_state] || emotionalUISettings.neutral;
      
      updateUIForEmotion(emotional_state);
      
      return {
        type: "tool_response",
        toolCallId: toolCallMessage.toolCallId,
        content: JSON.stringify({ success: true, applied: baseSettings }),
      };
    } catch (error) {
      console.error("Error in UI tool:", error);
      return {
        type: "tool_error",
        toolCallId: toolCallMessage.toolCallId,
        error: "Failed to update UI state",
        content: "There was an error updating the interface",
      };
    }
  };

  const handleBreathingToolCall = async (
    toolCallMessage: Hume.empathicVoice.ToolCallMessage
  ) => {
    try {
      console.log("Raw tool call message:", toolCallMessage);
      
      if (!toolCallMessage.parameters) {
        throw new Error("No parameters provided in tool call");
      }

      const params = JSON.parse(toolCallMessage.parameters);
      console.log("Parsed parameters:", params);

      if (!params.sequence || !Array.isArray(params.sequence) || params.sequence.length === 0) {
        throw new Error("Invalid or empty sequence in parameters");
      }

      const sequence = params.sequence.map(step => {
        if (!step.pattern || !step.duration) {
          throw new Error(`Invalid step in sequence: ${JSON.stringify(step)}`);
        }
        return {
          pattern: step.pattern as 'inhale' | 'exhale' | 'hold',
          duration: Number(step.duration)
        };
      });
      
      previousMuteState.current = isMuted;
      setIsMuted(true);
      
      setIsBreathingSession(true);
      
      setBreathingSequence(sequence);
      setCurrentBreathIndex(0);
      
      setBreathingDuration(sequence[0].duration);
      setBreathingPattern(sequence[0].pattern);
      setShowBreathingExercise(true);

      Animated.timing(breathingOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();

      console.log("Starting sequence:", sequence);

      await NativeAudio.stopRecording();

      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        const toolResponseMessage = {
          type: "tool_response",
          toolCallId: toolCallMessage.toolCallId,
          content: "Breathing exercise started",
        };
        
        chatSocketRef.current?.sendToolResponseMessage(toolResponseMessage);
      } else {
        console.log("Socket not open, skipping response message");
      }
    } catch (error) {
      console.error("Error handling breathing tool call:", error);
      console.error("Tool call message was:", toolCallMessage);
      
      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        const toolErrorMessage = {
          type: "tool_error",
          toolCallId: toolCallMessage.toolCallId,
          error: `Failed to start breathing exercise: ${error.message}`,
          fallback_content: "I couldn't start the breathing exercise. The sequence format was invalid. Would you like to try again with a simple breathing exercise?",
          level: "warn"
        };
        chatSocketRef.current?.sendToolErrorMessage(toolErrorMessage);
      } else {
        console.log("Socket not open, skipping error message");
        setLatestMessage("I couldn't start the breathing exercise. Please try reconnecting.");
      }
    }
  };

  const handleBreathStepComplete = () => {
    const nextIndex = currentBreathIndex + 1;
    
    if (nextIndex < breathingSequence.length) {
      setCurrentBreathIndex(nextIndex);
      setBreathingDuration(breathingSequence[nextIndex].duration);
      setBreathingPattern(breathingSequence[nextIndex].pattern);
    } else {
      handleBreathingComplete();
    }
  };

  const handleBreathingComplete = async () => {
    Animated.timing(breathingOpacity, {
      toValue: 0,
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setShowBreathingExercise(false);
      setIsBreathingSession(false);
      setBreathingSequence([]);
      setCurrentBreathIndex(0);
      
      setIsMuted(previousMuteState.current);
      
      if (isConnected) {
        try {
          if (!chatSocketRef.current || chatSocketRef.current.readyState !== WebSocket.OPEN) {
            await handleConnect();
          }
          await NativeAudio.startRecording();
        } catch (error) {
          console.error("Error resuming recording:", error);
        }
      }
    });
  };

  const updateEmotions = (newEmotions: Array<{emotion: string, score: number}>) => {
    Animated.parallel([
      Animated.timing(emotionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(emotionScale, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTopEmotions(newEmotions);
      
      Animated.parallel([
        Animated.timing(emotionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(emotionScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleIncomingMessage = async (
    message: Hume.empathicVoice.SubscribeEvent
  ) => {
    if (isBreathingSession && 
        !(message.type === "tool_call" && message.name === "breathing_exercise")) {
      return;
    }

    console.log(`Message type: ${message.type}\nStructure:`, JSON.stringify(getObjectStructure(message), null, 2));
    switch (message.type) {
      case "tool_call":
        if (message.name === "update_ui_state") {
          const response = await handleUIToolCall(message);
          chatSocketRef.current?.sendToolResponseMessage(response);
        } else if (message.name === "breathing_exercise") {
          await handleBreathingToolCall(message);
        }
        break;
      case "user_message":
        if (message.models?.prosody?.scores) {
          const scores = message.models.prosody.scores;
          const emotionScores = Object.entries(scores)
            .map(([emotion, score]) => ({ 
              emotion: emotion.replace(/([A-Z])/g, ' $1').toLowerCase(),
              score: score as number 
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          updateEmotions(emotionScores);
        }
        break;
      case "error":
        console.error(message);
        break;
      case "chat_metadata":
        console.log("Received chat metadata:", message);
        break;
      case "audio_output":
        await NativeAudio.enqueueAudio(message.data);
        break;
      case "assistant_message":
        addChatEntry({
          role: "assistant",
          timestamp: new Date().toString(),
          content: message.message.content!,
        });
        break;
      case "user_interruption":
        handleInterruption();
        break;
      case "assistant_end":
      case "tool_error":
      case "tool_response":
        console.log(`Received unhandled message type: ${message.type}`);
        break;
      default:
        console.error(`Unexpected message`);
        console.error(message);
        break;
    }
  };

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`https://hoyahacks25.onrender.com/api/patients/${HARDCODED_MRN}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full response:', data);

      if (!Array.isArray(data) || data.length === 0) {
        console.error('No patient data found');
        return;
      }

      // Get the most recent patient data (first element)
      const patientData = data[0];
      console.log('Using patient data:', patientData);
      
      if (!patientData.MRN) {
        console.error('Invalid patient data format');
        return;
      }

      setPatientData(patientData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const updatePatientData = async () => {
    if (!patientData) return;

    const now = new Date();
    const interactionTime = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000);

    try {
      const response = await fetch("https://hoyahacks25.onrender.com/api/patients", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          MRN: HARDCODED_MRN,
          startTime: sessionStartTime.current,
          interactionTime,
          emotionalState: currentEmotion
        })
        
      });

      if (!response.ok) {
        throw new Error('Failed to update patient data');
      }

      lastUpdateTime.current = now;
    } catch (error) {
      console.error('Error updating patient data:', error);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (isConnected) {
      const intervalId = setInterval(() => {
        updatePatientData();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [isConnected, currentEmotion]);

  const updateUIForEmotion = (emotion: keyof typeof emotionalUISettings) => {
    const settings = emotionalUISettings[emotion];
    console.log('Updating emotion to:', emotion);
    
    setNextGradient(settings.gradientColors);
    
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: settings.transitionDuration,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start(() => {
      setUIState({
        gradientColors: settings.gradientColors,
        transitionDuration: settings.transitionDuration,
      });
      fadeAnim.setValue(0);
    });
    
    setCurrentEmotion(emotion);
  };

  const DEFAULT_MESSAGE = "Hello! I'm Baymax, your friendly health companion. How can I help you today?";

  const handleConnectButtonPress = async () => {
    if (!isConnected) {
      sessionStartTime.current = new Date();
      lastUpdateTime.current = new Date();
      await animateTextChange("Listening...");
      setIsConnected(true);
      updatePatientData().catch(console.error);
    } else {
      await animateTextChange(DEFAULT_MESSAGE);
      setIsConnected(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: pageOpacity }]}>
      <LinearGradient
        colors={uiState.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={nextGradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <BlurView 
            intensity={20} 
            tint="light"
            style={styles.headerContainer}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleConnectButtonPress}
              >
                <Animated.View style={{ opacity: uiOpacity }}>
                  <Ionicons
                    name={isConnected ? "radio" : "radio-outline"}
                    size={32}
                    color="#1A1A1A"
                  />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Animated.View style={{ opacity: uiOpacity }}>
                  <Ionicons
                    name={isMuted ? "mic-off" : "mic"}
                    size={32}
                    color="#1A1A1A"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </BlurView>

          <View style={styles.messageContainer}>
            <Animated.Text 
              style={[
                styles.messageText,
                {
                  color: "#1A1A1A",
                  opacity: messageOpacity,
                  transform: [{
                    translateY: textPositionAnimation
                  }]
                }
              ]}
            >
              {latestMessage}
            </Animated.Text>
          </View>

          <BlurView
            intensity={20}
            tint="light"
            style={styles.footerContainer}
          >
            <View style={styles.footer}>
              <Animated.View 
                style={[
                  styles.emotionTags,
                  {
                    opacity: emotionOpacity,
                    transform: [{ scale: emotionScale }]
                  }
                ]}
              >
                {topEmotions.map((emotion, index) => (
                  <Animated.View 
                    key={emotion.emotion} 
                    style={[
                      styles.emotionTag,
                      { 
                        marginRight: index < topEmotions.length - 1 ? 8 : 0,
                      }
                    ]}
                  >
                    <Text style={styles.emotionTagText}>{emotion.emotion}</Text>
                  </Animated.View>
                ))}
              </Animated.View>
              <BlurView intensity={20} tint="light" style={styles.footerBlur}>
                <View style={styles.footerContent}>
                  {isConnected && !isMuted && <VoiceLevelBars isConnected={isConnected} isMuted={isMuted} />}
                  <Text style={[styles.footerText, { color: "#1A1A1A" }]}>
                    {isConnected ? "Listening..." : "Press the radio to start"}
                  </Text>
                </View>
              </BlurView>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
      {showBreathingExercise && (
        <Animated.View style={[styles.breathingOverlay, { opacity: breathingOpacity }]}>
          <BreathingExercise
            pattern={breathingPattern}
            duration={breathingDuration}
            onComplete={handleBreathStepComplete}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 20,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1A1A1A',
    lineHeight: 44,
    letterSpacing: 0.3,
  },
  footerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },
  footer: {
    padding: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    opacity: 0.8,
  },
  iconButton: {
    padding: 8,
  },
  breathingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  emotionTags: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emotionTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  emotionTagText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1A1A1A',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  footerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 4,
  },
  footerContent: {
    padding: 12,
    alignItems: 'center',
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    opacity: 0.8,
  },
  voiceBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginRight: 8,
  },
  voiceBar: {
    width: 3,
    height: 15,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 1,
    borderRadius: 2,
    opacity: 0.6,
  },
});
