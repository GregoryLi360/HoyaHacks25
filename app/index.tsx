import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  LayoutAnimation,
} from "react-native";

import { HumeClient, type Hume } from "hume";
import NativeAudio, { AudioEventPayload } from "..//modules/audio/src/AudioModule";

// Chat message type definition
interface ChatEntry {
  role: "user" | "assistant";
  timestamp: string;
  content: string;
}

// Hume client initialization with API key
const humeClientWithApiKey = () => {
  return new HumeClient({
    apiKey: process.env.EXPO_PUBLIC_HUME_API_KEY || "",
  });
}

// Production client with token authentication
const humeClientWithAccessToken = async () => {
  const url = process.env.EXPO_PUBLIC_MY_SERVER_AUTH_URL
  if (!url) {
    throw new Error("Please set EXPO_PUBLIC_MY_SERVER in your .env file");
  }
  const response = await fetch(url);
  const { accessToken } = await response.json();
  return new HumeClient({
    accessToken,
  });
}

export default function ChatScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const humeRef = useRef<HumeClient | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const chatSocketRef = useRef<Hume.empathicVoice.chat.ChatSocket | null>(null);

  const addChatEntry = (entry: ChatEntry) => {
    setChatEntries((prev) => [...prev, entry]);
  };

  const startClient = async () => {
    // For development only
    humeRef.current = humeClientWithApiKey();
  }

  // Auto-scroll chat
  useEffect(() => {
    if (scrollViewRef.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollViewRef.current.scrollToEnd();
    }
  }, [chatEntries]);

  const handleConnect = async () => {
    await startClient();
    const hume = humeRef.current!;
    try {
      await NativeAudio.getPermissions();
    } catch (error) {
      console.error("Failed to get permissions:", error);
    }

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
      if (
        chatSocketRef.current &&
        chatSocketRef.current.readyState === WebSocket.OPEN
      ) {
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
        console.log('Attempting to enqueue audio')
        await NativeAudio.enqueueAudio(message.data);
        break;
      case "user_message":
      case "assistant_message":
        if (
          message.message.role !== "user" &&
          message.message.role !== "assistant"
        ) {
          console.error(
            `Unhandled: received message with role: ${message.message.role}`
          );
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
    <View style={styles.appBackground}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            You are {isConnected ? "connected" : "disconnected"}
          </Text>
        </View>
        <ScrollView style={styles.chatDisplay} ref={scrollViewRef}>
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
              <Text style={styles.chatText}>{entry.content}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button
            title={isConnected ? "Disconnect" : "Connect"}
            onPress={() => setIsConnected(!isConnected)}
          />
          <Button
            title={isMuted ? "Unmute" : "Mute"}
            onPress={() => setIsMuted(!isMuted)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: "rgb(255, 244, 232)",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    maxWidth: 600,
    width: "100%",
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chatDisplay: {
    flex: 1,
    width: "100%",
    marginBottom: 16,
  },
  chatEntry: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  userChatEntry: {
    backgroundColor: "rgb(209, 226, 243)",
    alignSelf: "flex-end",
    marginRight: 10,
  },
  assistantChatEntry: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  chatText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
