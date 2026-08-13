import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { FileText, ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotes } from '../../services/studentApi';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function LecturePlayerScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { lectureId, lectureTitle, videoUrl, chapterId, lectureDesc } = useLocalSearchParams();
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialSeekTime, setInitialSeekTime] = useState(0);
  const [seekTimeLoaded, setSeekTimeLoaded] = useState(false);
  const lastSavedTimeRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const loadPosition = async () => {
      try {
        const saved = await AsyncStorage.getItem(`playback_position_${lectureId}`);
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed > 0) {
            setInitialSeekTime(parsed);
            lastSavedTimeRef.current = parsed;
          }
        }
      } catch (e) {
        console.warn("Failed to load playback position:", e);
      } finally {
        setSeekTimeLoaded(true);
      }
    };
    loadPosition();
  }, [lectureId]);

  const savePlaybackPosition = async (time) => {
    if (Math.abs(time - lastSavedTimeRef.current) >= 2) {
      lastSavedTimeRef.current = time;
      try {
        await AsyncStorage.setItem(`playback_position_${lectureId}`, time.toString());
      } catch (e) {
        console.warn("Failed to save playback position:", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const handleFullscreenToggle = async (fullscreenVal) => {
    setIsFullscreen(fullscreenVal);
    try {
      if (fullscreenVal) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    } catch (e) {
      console.warn("Failed to set screen orientation:", e);
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotes(chapterId);
        setNotes(data);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setNotesLoading(false);
      }
    };

    if (chapterId) {
      fetchNotes();
    } else {
      setNotesLoading(false);
    }
  }, [chapterId]);

  const handleNotePress = (note) => {
    router.push({
      pathname: '/(student)/note-viewer',
      params: { 
        noteTitle: note.title, 
        googleDriveViewLink: note.fileUrl
      }
    });
  };

  const { width, height } = useWindowDimensions();
  const portraitWidth = Math.min(width, height);
  const videoWidth = isFullscreen ? width : portraitWidth;
  const videoHeight = isFullscreen ? height : (portraitWidth * 9) / 16;

  const getEmbeddableUrl = (url) => {
    if (!url) return "";
    // YouTube link transformation (uses privacy-safe youtube-nocookie embed)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1].split("?")[0];
      }
      return `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&origin=https://youtube.com`;
    }
    // Google Drive link transformation
    if (url.includes("drive.google.com")) {
      return url.replace("/view", "/preview").replace("/edit", "/preview");
    }
    return url;
  };

  const embedUrl = getEmbeddableUrl(videoUrl);

  const getYoutubeVideoId = (url) => {
    if (!url) return "";
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      return url.split("v=")[1].split("&")[0];
    } else if (url.includes("embed/")) {
      return url.split("embed/")[1].split("?")[0];
    }
    return "";
  };

  const isYoutube = videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("youtube-nocookie.com"));
  const youtubeVideoId = isYoutube ? getYoutubeVideoId(videoUrl) : "";

  const customYoutubeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
          }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
          }
          .player-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          #player {
            position: absolute;
            top: 0;
            left: 0;
            width: 1920px;
            height: 1080px;
            border: none;
            z-index: 1;
            pointer-events: none;
            transform-origin: top left;
          }
          .click-catcher {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
          }
          
          .controls-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 3;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%);
          }
          
          .controls-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }
          
          .top-bar {
            padding: 15px;
            display: flex;
            justify-content: flex-end;
            pointer-events: auto;
          }
          
          .center-control {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: auto;
            z-index: 4;
          }
          .center-btn {
            background: rgba(30, 30, 30, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            width: 68px;
            height: 68px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            color: #fff;
            transition: transform 0.15s, background-color 0.2s;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          }
          .center-btn:active {
            transform: scale(0.9);
            background: rgba(30, 30, 30, 0.9);
          }
          
          .bottom-bar {
            padding: 12px 20px;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
          }
          
          .progress-container {
            display: flex;
            align-items: center;
            width: 100%;
            margin-bottom: 12px;
          }
          .progress-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.2);
            outline: none;
            cursor: pointer;
            transition: height 0.1s;
          }
          .progress-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #ff0000;
            cursor: pointer;
            box-shadow: 0 0 6px rgba(0,0,0,0.3);
          }
          
          .controls-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .left-controls, .right-controls {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .control-btn {
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.9;
            transition: opacity 0.2s, transform 0.1s;
          }
          .control-btn:active {
            transform: scale(0.9);
            opacity: 1;
          }
          
          .time-display {
            color: #e0e0e0;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          
          .loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 5;
            border: 3px solid rgba(255, 255, 255, 0.15);
            border-top: 3px solid #ff0000;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          
          .settings-menu {
            position: absolute;
            bottom: 60px;
            right: 20px;
            background: rgba(20, 20, 20, 0.97);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 8px 0;
            display: none;
            flex-direction: column;
            min-width: 220px;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            backdrop-filter: blur(12px);
            z-index: 10;
          }
          .settings-menu.visible { display: flex; }
          .settings-item {
            color: #e8e8e8;
            padding: 12px 16px;
            font-size: 14px;
            cursor: pointer;
            text-align: left;
            background: none;
            border: none;
            width: 100%;
            transition: background-color 0.15s;
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .settings-item:active { background: rgba(255,255,255,0.08); }
          .settings-item.active { color: #fff; font-weight: 600; }
          .settings-item .item-left {
            display: flex; align-items: center; gap: 12px;
          }
          .settings-item .item-left .item-icon {
            width: 22px; height: 22px; opacity: 0.9;
          }
          .settings-item .item-right {
            display: flex; align-items: center; gap: 4px;
            color: rgba(255,255,255,0.5); font-size: 13px;
          }
          .settings-item .item-right .chevron {
            width: 16px; height: 16px; opacity: 0.5;
          }
          .quality-header {
            color: #fff; font-size: 14px; font-weight: 600;
            padding: 12px 16px 8px; font-family: 'Inter', sans-serif;
          }
          .quality-header .header-res {
            color: rgba(255,255,255,0.5); font-weight: 400;
          }
          .quality-cat-item {
            color: #e8e8e8; padding: 14px 16px; font-size: 14px;
            cursor: pointer; text-align: left; background: none;
            border: none; width: 100%;
            font-family: 'Inter', sans-serif;
            display: flex; align-items: flex-start; gap: 12px;
            transition: background-color 0.15s;
          }
          .quality-cat-item:active { background: rgba(255,255,255,0.08); }
          .quality-cat-item .check-area {
            width: 24px; min-width: 24px; padding-top: 2px;
            display: flex; justify-content: center;
          }
          .quality-cat-item .cat-text { display: flex; flex-direction: column; gap: 2px; }
          .quality-cat-item .cat-title { font-weight: 600; font-size: 14px; }
          .quality-cat-item .cat-sub { font-size: 12px; color: rgba(255,255,255,0.45); font-weight: 400; }
          .quality-cat-item.active .cat-title { color: #fff; }
          .quality-res-item {
            color: #e8e8e8; padding: 14px 16px; font-size: 14px;
            cursor: pointer; text-align: left; background: none;
            border: none; width: 100%;
            font-family: 'Inter', sans-serif;
            display: flex; align-items: center; gap: 12px;
            transition: background-color 0.15s;
          }
          .quality-res-item .check-area {
            width: 24px; min-width: 24px;
            display: flex; justify-content: center;
          }
          .quality-res-item:active { background: rgba(255,255,255,0.08); }
          .quality-res-item.active { color: #fff; font-weight: 600; }
          .settings-back-btn {
            color: #fff; padding: 10px 16px; font-size: 13px;
            cursor: pointer; background: none; border: none;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            font-weight: 600; width: 100%;
            display: flex; align-items: center;
            font-family: 'Inter', sans-serif; margin-bottom: 4px;
          }
          .settings-back-btn:active { background: rgba(255,255,255,0.08); }
          .settings-divider {
            height: 1px; background: rgba(255,255,255,0.08);
            margin: 4px 0;
          }
          
          svg {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .center-btn svg {
            width: 32px;
            height: 32px;
          }
        </style>
      </head>
      <body>
        <div class="player-container">
          <div class="loader" id="loader"></div>
          <div id="player-container-inner" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
            <div id="player"></div>
          </div>
          <div class="click-catcher" id="clickCatcher"></div>
          
          <!-- Controls Overlay -->
          <div class="controls-overlay" id="controlsOverlay">
            <div class="top-bar"></div>
            
            <!-- Center Play/Pause -->
            <div class="center-control">
              <button class="center-btn" id="centerPlayBtn">
                <span id="centerPlayIcon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </span>
              </button>
            </div>
            
            <!-- Bottom Controls -->
            <div class="bottom-bar">
              <!-- Progress bar -->
              <div class="progress-container">
                <input type="range" class="progress-slider" id="progressSlider" min="0" max="100" value="0">
              </div>
              
              <!-- Controls Row -->
              <div class="controls-row">
                <div class="left-controls">
                  <button class="control-btn" id="playBtn">
                    <span id="playIcon">
                      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </span>
                  </button>
                  <button class="control-btn" id="rewindBtn">
                    <svg viewBox="0 0 24 24"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                  </button>
                  <button class="control-btn" id="forwardBtn">
                    <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </button>
                  <div class="time-display" id="timeDisplay">00:00 / 00:00</div>
                </div>
                
                <div class="right-controls">
                  <button class="control-btn" id="settingsBtn">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </button>
                  <button class="control-btn" id="fullscreenBtn">
                    <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Settings Menu -->
          <div class="settings-menu" id="settingsMenu">
            <!-- Tier 1: Main Options -->
            <div id="settingsMainOptions">
              <button class="settings-item" id="settingsQualityBtn">
                <span class="item-left">
                  <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                  Quality
                </span>
                <span class="item-right">
                  <span id="currentQualityLabel">Auto</span>
                  <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
              <button class="settings-item" id="settingsSpeedBtn">
                <span class="item-left">
                  <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Playback speed
                </span>
                <span class="item-right">
                  <span id="currentSpeedLabel">1x</span>
                  <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            </div>

            <!-- Tier 2a: Speed Options -->
            <div id="settingsSpeedOptions" style="display: none;">
              <button class="settings-back-btn" id="settingsSpeedBackBtn">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke-width: 3; margin-right: 6px; fill: none; stroke: currentColor;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Playback speed
              </button>
              <button class="settings-item option-speed" data-speed="0.5">0.5x</button>
              <button class="settings-item option-speed" data-speed="0.75">0.75x</button>
              <button class="settings-item option-speed active" data-speed="1">Normal</button>
              <button class="settings-item option-speed" data-speed="1.25">1.25x</button>
              <button class="settings-item option-speed" data-speed="1.5">1.5x</button>
              <button class="settings-item option-speed" data-speed="2">2x</button>
            </div>

            <!-- Tier 3: Quality Resolution Picker (Direct) -->
            <div id="settingsAdvancedQuality" style="display: none;">
              <button class="settings-back-btn" id="settingsAdvancedBackBtn">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke-width: 3; margin-right: 6px; fill: none; stroke: currentColor;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Quality
              </button>
              <div class="quality-header">Quality for current video <span class="header-res" id="advancedHeaderRes"></span></div>
              <div class="settings-divider"></div>
              <button class="quality-res-item option-quality" data-quality="auto" data-label="Auto">
                <span class="check-area"></span>
                <span class="res-text" id="autoResText">Auto</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="hd1080" data-label="1080p">
                <span class="check-area"></span>
                <span class="res-text">1080p</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="hd720" data-label="720p">
                <span class="check-area"></span>
                <span class="res-text">720p</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="large" data-label="480p">
                <span class="check-area"></span>
                <span class="res-text">480p</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="medium" data-label="360p">
                <span class="check-area"></span>
                <span class="res-text">360p</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="small" data-label="240p">
                <span class="check-area"></span>
                <span class="res-text">240p</span>
              </button>
              <button class="quality-res-item option-quality" data-quality="tiny" data-label="144p">
                <span class="check-area"></span>
                <span class="res-text">144p</span>
              </button>
            </div>
          </div>
        </div>

        <script>
          function log(msg) {
            console.log("[CustomPlayer]", msg);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
            }
          }

          window.onerror = function(message, source, lineno, colno, error) {
            log("Global error: " + message + " at " + source + ":" + lineno + ":" + colno);
            return false;
          };

          var player;
          var progressUpdateInterval;
          var controlsTimeout;
          var isMuted = false;
           const loader = document.getElementById('loader');
           const controlsOverlay = document.getElementById('controlsOverlay');
           const clickCatcher = document.getElementById('clickCatcher');
           const playBtn = document.getElementById('playBtn');
           const playIcon = document.getElementById('playIcon');
           const centerPlayBtn = document.getElementById('centerPlayBtn');
           const centerPlayIcon = document.getElementById('centerPlayIcon');
           const rewindBtn = document.getElementById('rewindBtn');
           const forwardBtn = document.getElementById('forwardBtn');
           const timeDisplay = document.getElementById('timeDisplay');
           const progressSlider = document.getElementById('progressSlider');
           const settingsBtn = document.getElementById('settingsBtn');
          const settingsMenu = document.getElementById('settingsMenu');
          const fullscreenBtn = document.getElementById('fullscreenBtn');
          var isFullscreen = false;
          var currentPlaybackRate = 1;
          var currentQuality = 'auto';

          const playSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
          const pauseSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
          


          log("Script initialized");

          var origin = window.location.origin;
          log("Detected origin: " + origin);
          if (origin === 'null' || !origin) {
            origin = 'https://youtube.com';
          }

          const resDimensions = {
            'hd1080': { w: 1920, h: 1080 },
            'hd720': { w: 1280, h: 720 },
            'large': { w: 854, h: 480 },
            'medium': { w: 640, h: 360 },
            'small': { w: 426, h: 240 },
            'tiny': { w: 256, h: 144 }
          };

          function resizePlayer() {
            const container = document.getElementById('player-container-inner');
            const targetIframe = document.getElementById('player');
            if (!container || !targetIframe) return;
            const containerWidth = container.clientWidth || window.innerWidth;
            const containerHeight = container.clientHeight || window.innerHeight;
            if (!containerWidth || !containerHeight) return;

            var baseWidth = 1280;
            if (currentQuality && currentQuality !== 'auto' && resDimensions[currentQuality]) {
              baseWidth = resDimensions[currentQuality].w;
            }

            // Fixed aspect ratio of 16:9
            const baseHeight = Math.round(baseWidth * 9 / 16);

            const scaleX = containerWidth / baseWidth;
            const scaleY = containerHeight / baseHeight;
            const scale = Math.min(scaleX, scaleY);

            const leftoverWidth = containerWidth - (baseWidth * scale);
            const leftoverHeight = containerHeight - (baseHeight * scale);
            const left = Math.round(leftoverWidth / 2);
            const top = Math.round(leftoverHeight / 2);
            
            targetIframe.style.position = 'absolute';
            targetIframe.style.width = baseWidth + 'px';
            targetIframe.style.height = baseHeight + 'px';
            targetIframe.style.transform = 'scale(' + scale + ')';
            targetIframe.style.left = left + 'px';
            targetIframe.style.top = top + 'px';
            targetIframe.style.border = 'none';
            targetIframe.style.pointerEvents = 'none';
            targetIframe.style.zIndex = '1';
            targetIframe.style.transformOrigin = 'top left';
          }
          window.addEventListener('resize', resizePlayer);
          setTimeout(resizePlayer, 100);

          function initPlayer(extraPlayerVars) {
            try {
              var playerVars = {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                showinfo: 0,
                playsinline: 1,
                enablejsapi: 1,
                origin: origin
              };
              if (extraPlayerVars) {
                Object.assign(playerVars, extraPlayerVars);
              }
              
              player = new YT.Player('player', {
                height: '1080',
                width: '1920',
                videoId: '${youtubeVideoId}',
                host: 'https://www.youtube-nocookie.com',
                playerVars: playerVars,
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange,
                  'onPlaybackQualityChange': onPlayerQualityChange,
                  'onError': onPlayerError
                }
              });
              resizePlayer(); // Resize immediately to prevent layout shift
              log("YT.Player wrapper initialized");
            } catch (err) {
              log("Error creating YT.Player: " + err.message);
            }
          }

          function reloadWithQuality(qualityVal, startTime) {
            log("Reloading player with vq=" + qualityVal + " at t=" + startTime);
            try { if (player && typeof player.destroy === 'function') player.destroy(); } catch(e) {}
            player = null;
            
            var container = document.getElementById('player-container-inner');
            container.innerHTML = '<div id="player"></div>';
            resizePlayer(); // Resize placeholder div immediately to prevent layout shift
            
            var extraVars = { autoplay: 1 };
            if (qualityVal && qualityVal !== 'auto') {
              extraVars.vq = qualityVal;
            }
            if (startTime > 0) {
              extraVars.start = Math.floor(startTime);
            }
            
            setTimeout(function() {
              initPlayer(extraVars);
            }, 150);
          }

          window.onYouTubeIframeAPIReady = function() {
            log("onYouTubeIframeAPIReady fired");
            var initialStart = parseFloat('${initialSeekTime}');
            if (!isNaN(initialStart) && initialStart > 0) {
              initPlayer({ start: Math.floor(initialStart) });
            } else {
              initPlayer();
            }
          };

          function onPlayerReady(event) {
            log("onPlayerReady fired");
            resizePlayer();
            loader.style.display = 'none';
            showControls();
            updateTime();
            progressUpdateInterval = setInterval(updateTime, 250);
            
            try {
              if (player && typeof player.setPlaybackRate === 'function') {
                player.setPlaybackRate(currentPlaybackRate);
                log("Playback rate restored to: " + currentPlaybackRate);
              }
            } catch (e) {
              log("Error setting playback rate on ready: " + e.message);
            }

            try {
              if (player && typeof player.playVideo === 'function') {
                player.playVideo();
                log("Autoplay forced in onReady");
              }
            } catch (e) {
              log("Play video error in onReady: " + e.message);
            }
          }

          function onPlayerQualityChange(event) {
            const q = event.data;
            log("onPlayerQualityChange: " + q);
            const resMap = {'highres':'2160p','hd1080':'1080p','hd720':'720p','large':'480p','medium':'360p','small':'240p','tiny':'144p','auto':''};
            const res = resMap[q] || '';
            var h2 = document.getElementById('advancedHeaderRes');
            if (h2) h2.innerText = res ? ' · ' + res : '';
            
            if (currentQuality === 'auto') {
              var labelEl = document.getElementById('currentQualityLabel');
              if (labelEl) {
                labelEl.innerText = res ? 'Auto (' + res + ')' : 'Auto';
              }
              var autoResEl = document.getElementById('autoResText');
              if (autoResEl) {
                autoResEl.innerText = res ? 'Auto (' + res + ')' : 'Auto';
              }
            }
            syncAdvancedCheckmarks();
          }

          function onPlayerStateChange(event) {
            log("onPlayerStateChange fired with state: " + event.data);
            if (event.data === YT.PlayerState.PLAYING) {
              playIcon.innerHTML = pauseSvg;
              centerPlayIcon.innerHTML = pauseSvg;
              hideControlsDelayed();
              try {
                if (player && typeof player.getPlaybackRate === 'function') {
                  if (player.getPlaybackRate() !== currentPlaybackRate) {
                    player.setPlaybackRate(currentPlaybackRate);
                    log("Restored playback rate to: " + currentPlaybackRate);
                  }
                }
              } catch (e) {
                log("Error restoring playback rate: " + e.message);
              }
            } else {
              playIcon.innerHTML = playSvg;
              centerPlayIcon.innerHTML = playSvg;
              showControls();
            }
          }

          function onPlayerError(event) {
            log("Player error code: " + event.data);
          }

          function togglePlay() {
            if (!player) {
              log("togglePlay failed: player not ready");
              return;
            }
            try {
              const state = player.getPlayerState();
              log("Toggling play. Current state: " + state);
              if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
              } else {
                player.playVideo();
              }
            } catch (err) {
              log("Error in togglePlay: " + err.message);
            }
            showControls();
          }

          function updateTime() {
            if (!player || typeof player.getCurrentTime !== 'function') return;
            try {
              const current = player.getCurrentTime();
              const duration = player.getDuration();
              
              if (duration > 0) {
                const pct = (current / duration) * 100;
                if (document.activeElement !== progressSlider) {
                  progressSlider.value = pct;
                  progressSlider.style.background = \`linear-gradient(to right, #ff0000 0%, #ff0000 \\\${pct}%, rgba(255,255,255,0.2) \\\${pct}%, rgba(255,255,255,0.2) 100%)\`;
                }
                timeDisplay.innerText = formatTime(current) + " / " + formatTime(duration);

                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'progress',
                    currentTime: current
                  }));
                }
              }

              // Update quality label dynamically
              if (currentQuality === 'auto' && typeof player.getPlaybackQuality === 'function') {
                const currentLevel = player.getPlaybackQuality();
                const qualityLabels = {
                  'highres': '1080p',
                  'hd1080': '1080p',
                  'hd720': '720p',
                  'large': '480p',
                  'medium': '360p',
                  'small': '240p',
                  'tiny': '144p',
                  'auto': 'Auto'
                };
                const activeLabel = qualityLabels[currentLevel] || currentLevel;
                const displayLabel = activeLabel && activeLabel !== 'Auto' ? 'Auto (' + activeLabel + ')' : 'Auto';
                
                const currentQualityLabelEl = document.getElementById('currentQualityLabel');
                if (currentQualityLabelEl && currentQualityLabelEl.innerText !== displayLabel) {
                  currentQualityLabelEl.innerText = displayLabel;
                }
                const autoResEl = document.getElementById('autoResText');
                if (autoResEl && autoResEl.innerText !== displayLabel) {
                  autoResEl.innerText = displayLabel;
                }
              }
            } catch (err) {
              // Ignore periodic check errors if player is not fully initialized
            }
          }

          function formatTime(sec) {
            if (isNaN(sec)) return "00:00";
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
          }

          playBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
          centerPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
          
          clickCatcher.addEventListener('click', () => {
            if (controlsOverlay.classList.contains('visible')) {
              hideControls();
            } else {
              showControls();
            }
          });

          controlsOverlay.addEventListener('click', (e) => {
            if (e.target === controlsOverlay) {
              hideControls();
            }
          });

          rewindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!player) return;
            const cur = player.getCurrentTime();
            player.seekTo(Math.max(0, cur - 10), true);
            showControls();
          });

          forwardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!player) return;
            const cur = player.getCurrentTime();
            const dur = player.getDuration();
            player.seekTo(Math.min(dur, cur + 10), true);
            showControls();
          });

          progressSlider.addEventListener('click', (e) => { e.stopPropagation(); });
          progressSlider.addEventListener('input', (e) => {
            if (!player) return;
            const dur = player.getDuration();
            const newTime = (e.target.value / 100) * dur;
            progressSlider.style.background = \`linear-gradient(to right, #ff0000 0%, #ff0000 \\\${e.target.value}%, rgba(255,255,255,0.2) \\\${e.target.value}%, rgba(255,255,255,0.2) 100%)\`;
            timeDisplay.innerText = formatTime(newTime) + " / " + formatTime(dur);
          });

          progressSlider.addEventListener('change', (e) => {
            if (!player) return;
            const dur = player.getDuration();
            const newTime = (e.target.value / 100) * dur;
            player.seekTo(newTime, true);
            showControls();
          });





          const settingsMainOptions = document.getElementById('settingsMainOptions');
          const settingsSpeedOptions = document.getElementById('settingsSpeedOptions');
          const settingsAdvancedQuality = document.getElementById('settingsAdvancedQuality');

          function hideAllPanels() {
            settingsMainOptions.style.display = 'none';
            settingsSpeedOptions.style.display = 'none';
            settingsAdvancedQuality.style.display = 'none';
          }
          function resetSettingsMenu() {
            hideAllPanels();
            settingsMainOptions.style.display = 'block';
          }

          var checkSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';

          function syncAdvancedCheckmarks() {
            document.querySelectorAll('.option-quality').forEach(b => {
              b.classList.remove('active');
              var check = b.querySelector('.check-area');
              if (check) check.innerHTML = '';
              if (b.dataset.quality === currentQuality) {
                b.classList.add('active');
                if (check) check.innerHTML = checkSvg;
              }
            });
          }

          function applyQuality(qualityVal, label) {
            currentQuality = qualityVal;
            var curTime = 0;
            try { if (player && typeof player.getCurrentTime === 'function') curTime = player.getCurrentTime(); } catch(e) {}
            document.getElementById('currentQualityLabel').innerText = label;
            
            var autoResEl = document.getElementById('autoResText');
            if (autoResEl && qualityVal !== 'auto') {
              autoResEl.innerText = 'Auto';
            }
            
            syncAdvancedCheckmarks();
            
            settingsMenu.classList.remove('visible');
            resetSettingsMenu();
            showControls();
            reloadWithQuality(qualityVal, curTime);
          }

          // Main settings toggle
          settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsMenu.classList.toggle('visible'); resetSettingsMenu(); });

          // Tier 1 → Tier 2 navigation
          document.getElementById('settingsSpeedBtn').addEventListener('click', (e) => { e.stopPropagation(); hideAllPanels(); settingsSpeedOptions.style.display = 'block'; });
          document.getElementById('settingsQualityBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            hideAllPanels();
            settingsAdvancedQuality.style.display = 'block';
            syncAdvancedCheckmarks();
          });

          // Back buttons
          document.getElementById('settingsSpeedBackBtn').addEventListener('click', (e) => { e.stopPropagation(); hideAllPanels(); settingsMainOptions.style.display = 'block'; });
          document.getElementById('settingsAdvancedBackBtn').addEventListener('click', (e) => { e.stopPropagation(); hideAllPanels(); settingsMainOptions.style.display = 'block'; });

          // Speed options
          const speedLabels = { '0.5':'0.5x', '0.75':'0.75x', '1':'Normal', '1.25':'1.25x', '1.5':'1.5x', '2':'2x' };
          document.querySelectorAll('.option-speed').forEach(item => {
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              const speedVal = e.currentTarget.dataset.speed;
              currentPlaybackRate = parseFloat(speedVal);
              player.setPlaybackRate(currentPlaybackRate);
              document.querySelectorAll('.option-speed').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              document.getElementById('currentSpeedLabel').innerText = speedLabels[speedVal] || (speedVal + 'x');
              settingsMenu.classList.remove('visible');
              resetSettingsMenu();
              showControls();
            });
          });

          // Tier 3: Advanced specific resolution buttons
          document.querySelectorAll('.option-quality').forEach(item => {
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              const qualityVal = e.currentTarget.dataset.quality;
              const label = e.currentTarget.dataset.label || qualityVal;
              applyQuality(qualityVal, label);
            });
          });

          document.addEventListener('click', () => {
            settingsMenu.classList.remove('visible');
            resetSettingsMenu();
          });

          fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isFullscreen = !isFullscreen;
            if (isFullscreen) {
              fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"></path></svg>';
            } else {
              fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
            }
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'fullscreen', 
                isFullscreen: isFullscreen 
              }));
            }
            showControls();
          });

          function showControls() {
            controlsOverlay.classList.add('visible');
            clearTimeout(controlsTimeout);
            if (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === YT.PlayerState.PLAYING) {
              hideControlsDelayed();
            }
          }

          function hideControls() {
            controlsOverlay.classList.remove('visible');
            settingsMenu.classList.remove('visible');
          }

          function hideControlsDelayed() {
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => {
              hideControls();
            }, 3000);
          }

          log("Injecting external iframe api script tag...");
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        </script>
      </body>
    </html>
  `;

  if (!seekTimeLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.textLight} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>Video Lecture</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{lectureTitle}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navyPrimary} />
          <Text style={styles.loadingText}>Loading playback progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={isFullscreen ? { flex: 1, backgroundColor: '#000' } : styles.container}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      {/* Header */}
      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft color={colors.textLight} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>Video Lecture</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{lectureTitle}</Text>
          </View>
        </View>
      )}

      {/* Video Embed Player Window */}
      <View style={isFullscreen ? styles.fullscreenVideoContainer : [styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
        {embedUrl ? (
          isYoutube ? (
            <WebView
              source={{
                html: customYoutubeHtml,
                baseUrl: 'https://youtube.com',
              }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
              textInteractionEnabled={false}
              allowsLinkPreview={false}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'log') {
                    console.log("[WebView Console]", data.message);
                  } else if (data.type === 'fullscreen') {
                    handleFullscreenToggle(data.isFullscreen);
                  } else if (data.type === 'progress') {
                    savePlaybackPosition(data.currentTime);
                  }
                } catch (e) {
                  // Not our JSON log
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                if (
                  request.url.includes('youtube.com/watch') ||
                  request.url.includes('youtu.be/') ||
                  request.url.includes('youtube.com/redirect')
                ) {
                  return false;
                }
                return true;
              }}
            />
          ) : (
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        body, html {
                          margin: 0;
                          padding: 0;
                          width: 100%;
                          height: 100%;
                          background-color: #000;
                          overflow: hidden;
                          -webkit-user-select: none !important;
                          -webkit-touch-callout: none !important;
                          user-select: none !important;
                        }
                        .player-container {
                          position: relative;
                          width: 100%;
                          height: 100%;
                        }
                        iframe {
                          width: 100%;
                          height: 100%;
                          border: none;
                          position: absolute;
                          top: 0;
                          left: 0;
                          z-index: 1;
                          -webkit-touch-callout: none !important;
                          -webkit-user-select: none !important;
                          user-select: none !important;
                        }
                        /* Block touches on top bar (Title & Share button) */
                        .blocker-top {
                          position: absolute;
                          top: 0;
                          left: 0;
                          width: 100%;
                          height: 55px;
                          z-index: 10;
                          background: rgba(0,0,0,0.01);
                        }
                        /* Block touches on bottom left (Link icon) */
                        .blocker-bottom-left {
                          position: absolute;
                          bottom: 0;
                          left: 0;
                          width: 70px;
                          height: 50px;
                          z-index: 10;
                          background: rgba(0,0,0,0.01);
                        }
                        /* Block touches on bottom right (YouTube logo) */
                        .blocker-bottom-right {
                          position: absolute;
                          bottom: 0;
                          right: 0;
                          width: 90px;
                          height: 50px;
                          z-index: 10;
                          background: rgba(0,0,0,0.01);
                        }
                      </style>
                    </head>
                    <body oncontextmenu="return false;">
                      <div class="player-container">
                        <iframe
                          src="${embedUrl}"
                          referrerpolicy="strict-origin-when-cross-origin"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                          oncontextmenu="return false;"
                        ></iframe>
                        <div class="blocker-top"></div>
                        <div class="blocker-bottom-left"></div>
                        <div class="blocker-bottom-right"></div>
                      </div>
                      <script>
                        window.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
                        document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
                        window.addEventListener('copy', function(e) { e.preventDefault(); }, true);
                        window.addEventListener('cut', function(e) { e.preventDefault(); }, true);
                      </script>
                    </body>
                  </html>
                `,
                baseUrl: 'https://youtube.com',
              }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
              textInteractionEnabled={false}
              allowsLinkPreview={false}
              onShouldStartLoadWithRequest={(request) => {
                if (
                  request.url.includes('youtube.com/watch') ||
                  request.url.includes('youtu.be/') ||
                  request.url.includes('youtube.com/redirect')
                ) {
                  return false;
                }
                return true;
              }}
            />
          )
        ) : (
          <View style={styles.noVideoContainer}>
            <ShieldAlert color={colors.textSecondary} size={48} />
            <Text style={styles.noVideoText}>No video source provided</Text>
          </View>
        )}
      </View>

      {/* Lecture Description Box */}
      {!isFullscreen && lectureDesc ? (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionTitle}>About this Lecture</Text>
          <Text style={styles.descriptionText}>{lectureDesc}</Text>
        </View>
      ) : null}

      {/* Study Materials & Notes Section */}
      {!isFullscreen && (
        <View style={styles.materialsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconContainer}>
              <FileText color={colors.accentBlue} size={18} />
            </View>
            <Text style={styles.sectionTitle}>Handouts & Study Notes ({notes.length})</Text>
          </View>

          {notesLoading ? (
            <View style={styles.notesLoadingContainer}>
              <ActivityIndicator size="small" color={colors.navyPrimary} />
              <Text style={styles.notesLoadingText}>Fetching lecture materials...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyNotesCard}>
              <FileText color={colors.textSecondary} size={40} />
              <Text style={styles.emptyNotesText}>No resources uploaded yet</Text>
              <Text style={styles.emptyNotesSubtitle}>Study materials for this lecture will appear here.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.notesList}>
              {notes.map((note) => (
                <TouchableOpacity
                  key={note._id}
                  onPress={() => handleNotePress(note)}
                  style={styles.noteItem}
                  activeOpacity={0.8}
                >
                  <View style={styles.noteIconContainer}>
                    <FileText color={colors.accentBlue} size={22} />
                  </View>
                  <View style={styles.noteDetails}>
                    <Text style={styles.noteTitle} numberOfLines={1}>
                      {note.title}
                    </Text>
                    <Text style={styles.noteSubtitle}>
                      PDF DOCUMENT
                    </Text>
                  </View>
                  <Text style={styles.openText}>
                    Open →
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: colors.navySecondary,
    backgroundColor: colors.navyPrimary,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginRight: Spacing.three,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 18,
  },
  videoContainer: {
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullscreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    backgroundColor: '#000000',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A202C',
  },
  noVideoText: {
    color: colors.textSecondary,
    marginTop: Spacing.two,
    fontWeight: '500',
  },
  descriptionBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    ...colors.cardShadow,
  },
  descriptionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  descriptionText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  materialsSection: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionIconContainer: {
    backgroundColor: colors.accentLight,
    padding: 6,
    borderRadius: 8,
    marginRight: Spacing.two,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  notesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  notesLoadingText: {
    color: colors.textSecondary,
    marginTop: Spacing.two,
    fontSize: 14,
  },
  emptyNotesCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Spacing.three,
    padding: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...colors.cardShadow,
  },
  emptyNotesText: {
    color: colors.text,
    marginTop: Spacing.three,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyNotesSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  notesList: {
    paddingBottom: Spacing.five,
  },
  noteItem: {
    backgroundColor: colors.background,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    ...colors.cardShadow,
  },
  noteIconContainer: {
    backgroundColor: colors.accentLight,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  noteDetails: {
    flex: 1,
    marginRight: Spacing.two,
  },
  noteTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  noteSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  openText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.accentBlue,
  },
});
