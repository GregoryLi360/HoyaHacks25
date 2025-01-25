import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  LayoutAnimation,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { HumeClient, type Hume } from "hume";
import NativeAudio, { AudioEventPayload } from "../modules/audio/src/AudioModule";

interface ChatEntry {
  role: "user" | "assistant";
  timestamp: string;
  content: string;
}

const humeClientWithApiKey = () => {
  return new HumeClient({
    apiKey: process.env.EXPO_PUBLIC_HUME_API_KEY || "",
  });
}

export default function ChatScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const humeRef = useRef<HumeClient | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const chatSocketRef = useRef<Hume.empathicVoice.chat.ChatSocket | null>(null);

  const addChatEntry = (entry: ChatEntry) => {
    setChatEntries((prev) => [...prev, entry]);
  };

  const startClient = async () => {
    humeRef.current = humeClientWithApiKey();
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollViewRef.current.scrollToEnd();
    }
  }, [chatEntries]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await startClient();
      const hume = humeRef.current!;
      await NativeAudio.getPermissions();

      const chatSocket = hume.empathicVoice.chat.connect({
        configId: process.env.EXPO_PUBLIC_HUME_CONFIG_ID,
      });

      chatSocket.on("open", () => {
        NativeAudio.startRecording().catch(error => {
          console.error("Failed to start recording:", error);
        });
        if (NativeAudio.isLinear16PCM) {
          chatSocket.sendSessionSettings({
            audio: {
              encoding: "linear16",
              channels: 1,
              sampleRate: NativeAudio.sampleRate,
            },
          });
        }
        setIsConnected(true);
        addChatEntry({
          role: "assistant",
          timestamp: new Date().toString(),
          content: "Hello! I'm your medical assistant. How can I help you today?",
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
    } finally {
      setIsLoading(false);
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
    if (isConnected) {
      handleConnect().catch((error) => {
        console.error("Error while connecting:", error);
      });
    } else {
      handleDisconnect().catch((error) => {
        console.error("Error while disconnecting:", error);
      });
    }
    return () => {
      NativeAudio.stopRecording().catch((error: any) => {
        console.error("Error while stopping recording", error);
      });
      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        chatSocketRef.current?.close();
      }
    };
  }, [isConnected]);

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

  const handleIncomingMessage = async (
    message: Hume.empathicVoice.SubscribeEvent
  ) => {
    switch (message.type) {
      case "error":
        console.error(message);
        break;
      case "chat_metadata":
        console.log("Received chat metadata:", message);
        break;
      case "audio_output":
        await NativeAudio.enqueueAudio(message.data);
        break;
      case "user_message":
      case "assistant_message":
        if (
          message.message.role !== "user" &&
          message.message.role !== "assistant"
        ) {
          return;
        }
        if (message.type === "user_message") {
          handleInterruption();
        }
        addChatEntry({
          role: message.message.role,
          timestamp: new Date().toString(),
          content: message.message.content!,
        });
        break;
      case "user_interruption":
        handleInterruption();
        break;
      case "assistant_end":
      case "tool_call":
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Medical Assistant</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
          <Text style={styles.statusText}>
            {isConnected ? "Connected" : "Disconnected"}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.chatDisplay} 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContent}
      >
        {chatEntries.map((entry, index) => (
          <View
            key={index}
            style={[
              styles.chatEntry,
              entry.role === "user"
                ? styles.userChatEntry
                : styles.assistantChatEntry,
            ]}
          >
            {entry.role === "assistant" && (
              <View style={styles.assistantHeader}>
                <Ionicons name="medical" size={20} color="#4A90E2" />
                <Text style={styles.assistantName}>Medical Assistant</Text>
              </View>
            )}
            <Text style={styles.chatText}>{entry.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#4A90E2" />
        ) : (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, isConnected ? styles.buttonDanger : styles.buttonPrimary]}
              onPress={() => setIsConnected(!isConnected)}
            >
              <Ionicons 
                name={isConnected ? "power" : "power-outline"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.buttonText}>
                {isConnected ? "End Session" : "Start Session"}
              </Text>
            </TouchableOpacity>

            {isConnected && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Ionicons 
                  name={isMuted ? "mic-off" : "mic"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.buttonText}>
                  {isMuted ? "Unmute" : "Mute"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connected: {
    backgroundColor: "#4CAF50",
  },
  disconnected: {
    backgroundColor: "#FF5252",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  chatDisplay: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  chatEntry: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userChatEntry: {
    backgroundColor: "#4A90E2",
    alignSelf: "flex-end",
    marginLeft: "15%",
  },
  assistantChatEntry: {
    backgroundColor: "white",
    alignSelf: "flex-start",
    marginRight: "15%",
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
    marginLeft: 6,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1A1A1A",
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 150,
  },
  buttonPrimary: {
    backgroundColor: "#4A90E2",
  },
  buttonSecondary: {
    backgroundColor: "#738A94",
  },
  buttonDanger: {
    backgroundColor: "#FF5252",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
