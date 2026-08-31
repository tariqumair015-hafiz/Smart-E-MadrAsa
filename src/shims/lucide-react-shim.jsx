import React from 'react';

const iconData = {
  Search: "<path d=\"m21 21-4.34-4.34\" />\n  <circle cx=\"11\" cy=\"11\" r=\"8\" />",
  Download: "<path d=\"M12 15V3\" />\n  <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />\n  <path d=\"m7 10 5 5 5-5\" />",
  BookOpen: "<path d=\"M12 7v14\" />\n  <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
  GraduationCap: "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" />\n  <path d=\"M22 10v6\" />\n  <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  BookDashed: "<path d=\"M12 17h1.5\" />\n  <path d=\"M12 22h1.5\" />\n  <path d=\"M12 2h1.5\" />\n  <path d=\"M17.5 22H19a1 1 0 0 0 1-1\" />\n  <path d=\"M17.5 2H19a1 1 0 0 1 1 1v1.5\" />\n  <path d=\"M20 14v3h-2.5\" />\n  <path d=\"M20 8.5V10\" />\n  <path d=\"M4 10V8.5\" />\n  <path d=\"M4 19.5V14\" />\n  <path d=\"M4 4.5A2.5 2.5 0 0 1 6.5 2H8\" />\n  <path d=\"M8 22H6.5a1 1 0 0 1 0-5H8\" />",
  BookPlaceholder: "<path d=\"M12 17h1.5\" />\n  <path d=\"M12 22h1.5\" />\n  <path d=\"M12 2h1.5\" />\n  <path d=\"M17.5 22H19a1 1 0 0 0 1-1\" />\n  <path d=\"M17.5 2H19a1 1 0 0 1 1 1v1.5\" />\n  <path d=\"M20 14v3h-2.5\" />\n  <path d=\"M20 8.5V10\" />\n  <path d=\"M4 10V8.5\" />\n  <path d=\"M4 19.5V14\" />\n  <path d=\"M4 4.5A2.5 2.5 0 0 1 6.5 2H8\" />\n  <path d=\"M8 22H6.5a1 1 0 0 1 0-5H8\" />",
  Sun: "<circle cx=\"12\" cy=\"12\" r=\"4\" />\n  <path d=\"M12 2v2\" />\n  <path d=\"M12 20v2\" />\n  <path d=\"m4.93 4.93 1.41 1.41\" />\n  <path d=\"m17.66 17.66 1.41 1.41\" />\n  <path d=\"M2 12h2\" />\n  <path d=\"M20 12h2\" />\n  <path d=\"m6.34 17.66-1.41 1.41\" />\n  <path d=\"m19.07 4.93-1.41 1.41\" />",
  Moon: "<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\" />",
  User: "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" />\n  <circle cx=\"12\" cy=\"7\" r=\"4\" />",
  Library: "<path d=\"m16 6 4 14\" />\n  <path d=\"M12 6v14\" />\n  <path d=\"M8 8v12\" />\n  <path d=\"M4 4v16\" />",
  BookText: "<path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20\" />\n  <path d=\"M8 11h8\" />\n  <path d=\"M8 7h6\" />",
  ScrollText: "<path d=\"M15 12h-5\" />\n  <path d=\"M15 8h-5\" />\n  <path d=\"M19 17V5a2 2 0 0 0-2-2H4\" />\n  <path d=\"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3\" />",
  Sparkles: "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\" />\n  <path d=\"M20 2v4\" />\n  <path d=\"M22 4h-4\" />\n  <circle cx=\"4\" cy=\"20\" r=\"2\" />",
  BookMarked: "<path d=\"M10 2v8l3-3 3 3V2\" />\n  <path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20\" />",
  Languages: "<path d=\"m5 8 6 6\" />\n  <path d=\"m4 14 6-6 2-3\" />\n  <path d=\"M2 5h12\" />\n  <path d=\"M7 2h1\" />\n  <path d=\"m22 22-5-10-5 10\" />\n  <path d=\"M14 18h6\" />",
  Users: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" />\n  <path d=\"M16 3.128a4 4 0 0 1 0 7.744\" />\n  <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" />\n  <circle cx=\"9\" cy=\"7\" r=\"4\" />",
  CheckCircle: "<path d=\"M21.801 10A10 10 0 1 1 17 3.335\" />\n  <path d=\"m9 11 3 3L22 4\" />",
  Bookmark: "<path d=\"M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z\" />",
  ArrowLeft: "<path d=\"m12 19-7-7 7-7\" />\n  <path d=\"M19 12H5\" />",
  CircleX: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"m15 9-6 6\" />\n  <path d=\"m9 9 6 6\" />",
  XCircle: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"m15 9-6 6\" />\n  <path d=\"m9 9 6 6\" />",
  Trash2: "<path d=\"M10 11v6\" />\n  <path d=\"M14 11v6\" />\n  <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\" />\n  <path d=\"M3 6h18\" />\n  <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\" />",
  Share2: "<circle cx=\"18\" cy=\"5\" r=\"3\" />\n  <circle cx=\"6\" cy=\"12\" r=\"3\" />\n  <circle cx=\"18\" cy=\"19\" r=\"3\" />\n  <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" />\n  <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  DownloadCloud: "<path d=\"M12 13v8l-4-4\" />\n  <path d=\"m12 21 4-4\" />\n  <path d=\"M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284\" />",
  UploadCloud: "<path d=\"M12 13v8\" />\n  <path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" />\n  <path d=\"m8 17 4-4 4 4\" />",
  AlertCircle: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" />\n  <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />",
  CheckCircle2: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"m9 12 2 2 4-4\" />",
  Loader2: "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\" />",
  FolderOpen: "<path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\" />",
  Compass: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\" />",
  MapPin: "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" />\n  <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  Play: "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\" />",
  Pause: "<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\" />\n  <rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\" />",
  ChevronRight: "<path d=\"m9 18 6-6-6-6\" />",
  WifiOff: "<path d=\"M12 20h.01\" />\n  <path d=\"M8.5 16.429a5 5 0 0 1 7 0\" />\n  <path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\" />\n  <path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\" />\n  <path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\" />\n  <path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\" />\n  <path d=\"m2 2 20 20\" />",
  RotateCcw: "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" />\n  <path d=\"M3 3v5h5\" />",
  RotateCw: "<path d=\"M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" />\n  <path d=\"M21 3v5h-5\" />",
  SlidersHorizontal: "<path d=\"M10 5H3\" />\n  <path d=\"M12 19H3\" />\n  <path d=\"M14 3v4\" />\n  <path d=\"M16 17v4\" />\n  <path d=\"M21 12h-9\" />\n  <path d=\"M21 19h-5\" />\n  <path d=\"M21 5h-7\" />\n  <path d=\"M8 10v4\" />\n  <path d=\"M8 12H3\" />",
  Star: "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />",
  Grid3X3: "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />\n  <path d=\"M3 9h18\" />\n  <path d=\"M3 15h18\" />\n  <path d=\"M9 3v18\" />\n  <path d=\"M15 3v18\" />",
  List: "<path d=\"M3 5h.01\" />\n  <path d=\"M3 12h.01\" />\n  <path d=\"M3 19h.01\" />\n  <path d=\"M8 5h13\" />\n  <path d=\"M8 12h13\" />\n  <path d=\"M8 19h13\" />",
  ChevronDown: "<path d=\"m6 9 6 6 6-6\" />",
  ChevronUp: "<path d=\"m18 15-6-6-6 6\" />",
  Bot: "<path d=\"M12 8V4H8\" />\n  <rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\" />\n  <path d=\"M2 14h2\" />\n  <path d=\"M20 14h2\" />\n  <path d=\"M15 13v2\" />\n  <path d=\"M9 13v2\" />",
  Filter: "<path d=\"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z\" />",
  Tag: "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" />\n  <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
  Gift: "<path d=\"M12 7v14\" />\n  <path d=\"M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8\" />\n  <path d=\"M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5\" />\n  <rect x=\"3\" y=\"7\" width=\"18\" height=\"4\" rx=\"1\" />",
  Zap: "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />",
  Heart: "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\" />",
  Home: "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" />\n  <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
  MoreHorizontal: "<circle cx=\"12\" cy=\"12\" r=\"1\" />\n  <circle cx=\"19\" cy=\"12\" r=\"1\" />\n  <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  MessageSquare: "<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\" />",
  Mic: "<path d=\"M12 19v3\" />\n  <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" />\n  <rect x=\"9\" y=\"2\" width=\"6\" height=\"13\" rx=\"3\" />",
  Disc: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  Database: "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\" />\n  <path d=\"M3 5V19A9 3 0 0 0 21 19V5\" />\n  <path d=\"M3 12A9 3 0 0 0 21 12\" />",
  BookHeart: "<path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20\" />\n  <path d=\"M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z\" />",
  Copy: "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" />\n  <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />",
  Send: "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\" />\n  <path d=\"m21.854 2.147-10.94 10.939\" />",
  Smile: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"M8 14s1.5 2 4 2 4-2 4-2\" />\n  <line x1=\"9\" x2=\"9.01\" y1=\"9\" y2=\"9\" />\n  <line x1=\"15\" x2=\"15.01\" y1=\"9\" y2=\"9\" />",
  Frown: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"M16 16s-1.5-2-4-2-4 2-4 2\" />\n  <line x1=\"9\" x2=\"9.01\" y1=\"9\" y2=\"9\" />\n  <line x1=\"15\" x2=\"15.01\" y1=\"9\" y2=\"9\" />",
  CloudRain: "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" />\n  <path d=\"M16 14v6\" />\n  <path d=\"M8 14v6\" />\n  <path d=\"M12 16v6\" />",
  BookOpenText: "<path d=\"M12 7v14\" />\n  <path d=\"M16 12h2\" />\n  <path d=\"M16 8h2\" />\n  <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />\n  <path d=\"M6 12h2\" />\n  <path d=\"M6 8h2\" />",
  Calendar: "<path d=\"M8 2v4\" />\n  <path d=\"M16 2v4\" />\n  <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" />\n  <path d=\"M3 10h18\" />",
  ClipboardList: "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" />\n  <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" />\n  <path d=\"M12 11h4\" />\n  <path d=\"M12 16h4\" />\n  <path d=\"M8 11h.01\" />\n  <path d=\"M8 16h.01\" />",
  Clock: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"M12 6v6l4 2\" />",
  Plus: "<path d=\"M5 12h14\" />\n  <path d=\"M12 5v14\" />",
  Save: "<path d=\"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\" />\n  <path d=\"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7\" />\n  <path d=\"M7 3v4a1 1 0 0 0 1 1h7\" />",
  Volume2: "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" />\n  <path d=\"M16 9a5 5 0 0 1 0 6\" />\n  <path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />",
  VolumeX: "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" />\n  <line x1=\"22\" x2=\"16\" y1=\"9\" y2=\"15\" />\n  <line x1=\"16\" x2=\"22\" y1=\"9\" y2=\"15\" />",
  Smartphone: "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" />\n  <path d=\"M12 18h.01\" />",
  SmartphoneOff: "<path d=\"M17 2H7a2 2 0 0 0-2 2v2M5 11v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M19 9V4a2 2 0 0 0-2-2\" />\n  <path d=\"M12 18h.01\" />\n  <path d=\"m2 2 20 20\" />",
  Layers: "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\" />\n  <path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\" />\n  <path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\" />",
  Brain: "<path d=\"M12 18V5\" />\n  <path d=\"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4\" />\n  <path d=\"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5\" />\n  <path d=\"M17.997 5.125a4 4 0 0 1 2.526 5.77\" />\n  <path d=\"M18 18a4 4 0 0 0 2-7.464\" />\n  <path d=\"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517\" />\n  <path d=\"M6 18a4 4 0 0 1-2-7.464\" />\n  <path d=\"M6.003 5.125a4 4 0 0 0-2.526 5.77\" />",
  Flame: "<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\" />",
  Trophy: "<path d=\"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978\" />\n  <path d=\"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978\" />\n  <path d=\"M18 9h1.5a1 1 0 0 0 0-5H18\" />\n  <path d=\"M4 22h16\" />\n  <path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\" />\n  <path d=\"M6 9H4.5a1 1 0 0 1 0-5H6\" />",
  Target: "<circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <circle cx=\"12\" cy=\"12\" r=\"6\" />\n  <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  SkipBack: "<path d=\"M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z\" />\n  <path d=\"M3 20V4\" />",
  SkipForward: "<path d=\"M21 4v16\" />\n  <path d=\"M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z\" />",
  Settings: "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\" />\n  <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  Repeat: "<path d=\"m17 2 4 4-4 4\" />\n  <path d=\"M3 11v-1a4 4 0 0 1 4-4h14\" />\n  <path d=\"m7 22-4-4 4-4\" />\n  <path d=\"M21 13v1a4 4 0 0 1-4 4H3\" />",
  Wifi: "<path d=\"M12 20h.01\" />\n  <path d=\"M2 8.82a15 15 0 0 1 20 0\" />\n  <path d=\"M5 12.859a10 10 0 0 1 14 0\" />\n  <path d=\"M8.5 16.429a5 5 0 0 1 7 0\" />",
  ExternalLink: "<path d=\"M15 3h6v6\" />\n  <path d=\"M10 14 21 3\" />\n  <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  Calculator: "<rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\" />\n  <line x1=\"8\" x2=\"16\" y1=\"6\" y2=\"6\" />\n  <line x1=\"16\" x2=\"16\" y1=\"14\" y2=\"18\" />\n  <path d=\"M16 10h.01\" />\n  <path d=\"M12 10h.01\" />\n  <path d=\"M8 10h.01\" />\n  <path d=\"M12 14h.01\" />\n  <path d=\"M8 14h.01\" />\n  <path d=\"M12 18h.01\" />\n  <path d=\"M8 18h.01\" />",
  Receipt: "<path d=\"M12 17V7\" />\n  <path d=\"M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8\" />\n  <path d=\"M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z\" />",
  LayoutGrid: "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" />\n  <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" />\n  <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" />\n  <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  Upload: "<path d=\"M12 3v12\" />\n  <path d=\"m17 8-5-5-5 5\" />\n  <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />",
  Image: "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" />\n  <circle cx=\"9\" cy=\"9\" r=\"2\" />\n  <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />",
  FileText: "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" />\n  <path d=\"M14 2v5a1 1 0 0 0 1 1h5\" />\n  <path d=\"M10 9H8\" />\n  <path d=\"M16 13H8\" />\n  <path d=\"M16 17H8\" />",
  Pencil: "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" />\n  <path d=\"m15 5 4 4\" />",
  Loader: "<path d=\"M12 2v4\" />\n  <path d=\"m16.2 7.8 2.9-2.9\" />\n  <path d=\"M18 12h4\" />\n  <path d=\"m16.2 16.2 2.9 2.9\" />\n  <path d=\"M12 18v4\" />\n  <path d=\"m4.9 19.1 2.9-2.9\" />\n  <path d=\"M2 12h4\" />\n  <path d=\"m4.9 4.9 2.9 2.9\" />",
  X: "<path d=\"M18 6 6 18\" />\n  <path d=\"m6 6 12 12\" />",
};

const make = (name) => {
  const Comp = (props) => {
    const rawSvgContent = iconData[name];
    if (!rawSvgContent) return null;
    return (
      <svg
        aria-hidden="true"
        width={props.size || 20}
        height={props.size || 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={props.strokeWidth || 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
        dangerouslySetInnerHTML={{ __html: rawSvgContent }}
      />
    );
  };
  Comp.displayName = name;
  return Comp;
};

export const Search = make('Search');
export const Download = make('Download');
export const BookOpen = make('BookOpen');
export const GraduationCap = make('GraduationCap');
export const BookDashed = make('BookDashed');
export const BookPlaceholder = make('BookPlaceholder');
export const Sun = make('Sun');
export const Moon = make('Moon');
export const User = make('User');
export const Library = make('Library');
export const BookText = make('BookText');
export const ScrollText = make('ScrollText');
export const Sparkles = make('Sparkles');
export const BookMarked = make('BookMarked');
export const Languages = make('Languages');
export const Users = make('Users');
export const CheckCircle = make('CheckCircle');
export const Bookmark = make('Bookmark');
export const ArrowLeft = make('ArrowLeft');
export const CircleX = make('CircleX');
export const XCircle = make('XCircle');
export const Trash2 = make('Trash2');
export const Share2 = make('Share2');
export const DownloadCloud = make('DownloadCloud');
export const UploadCloud = make('UploadCloud');
export const AlertCircle = make('AlertCircle');
export const CheckCircle2 = make('CheckCircle2');
export const Loader2 = make('Loader2');
export const FolderOpen = make('FolderOpen');
export const Compass = make('Compass');
export const MapPin = make('MapPin');
export const Play = make('Play');
export const Pause = make('Pause');
export const ChevronRight = make('ChevronRight');
export const WifiOff = make('WifiOff');
export const RotateCcw = make('RotateCcw');
export const RotateCw = make('RotateCw');
export const SlidersHorizontal = make('SlidersHorizontal');
export const Star = make('Star');
export const Grid3X3 = make('Grid3X3');
export const List = make('List');
export const ChevronDown = make('ChevronDown');
export const ChevronUp = make('ChevronUp');
export const Bot = make('Bot');
export const Filter = make('Filter');
export const Tag = make('Tag');
export const Gift = make('Gift');
export const Zap = make('Zap');
export const Heart = make('Heart');
export const Home = make('Home');
export const MoreHorizontal = make('MoreHorizontal');
export const MessageSquare = make('MessageSquare');
export const Mic = make('Mic');
export const Disc = make('Disc');
export const Database = make('Database');
export const BookHeart = make('BookHeart');
export const Copy = make('Copy');
export const Send = make('Send');
export const Smile = make('Smile');
export const Frown = make('Frown');
export const CloudRain = make('CloudRain');
export const BookOpenText = make('BookOpenText');
export const Calendar = make('Calendar');
export const ClipboardList = make('ClipboardList');
export const Clock = make('Clock');
export const Plus = make('Plus');
export const Save = make('Save');
export const Volume2 = make('Volume2');
export const VolumeX = make('VolumeX');
export const Smartphone = make('Smartphone');
export const SmartphoneOff = make('SmartphoneOff');
export const Layers = make('Layers');
export const Brain = make('Brain');
export const Flame = make('Flame');
export const Trophy = make('Trophy');
export const Target = make('Target');
export const SkipBack = make('SkipBack');
export const SkipForward = make('SkipForward');
export const Settings = make('Settings');
export const Repeat = make('Repeat');
export const Wifi = make('Wifi');
export const ExternalLink = make('ExternalLink');
export const Calculator = make('Calculator');
export const Receipt = make('Receipt');
export const LayoutGrid = make('LayoutGrid');
export const Upload = make('Upload');
export const Image = make('Image');
export const FileText = make('FileText');
export const Pencil = make('Pencil');
export const Loader = make('Loader');
export const X = make('X');

export default {
  Search,
  Download,
  BookOpen,
  GraduationCap,
  BookDashed,
  BookPlaceholder,
  Sun,
  Moon,
  User,
  Library,
  BookText,
  ScrollText,
  Sparkles,
  BookMarked,
  Languages,
  Users,
  CheckCircle,
  Bookmark,
  ArrowLeft,
  CircleX,
  XCircle,
  Trash2,
  Share2,
  DownloadCloud,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderOpen,
  Compass,
  MapPin,
  Play,
  Pause,
  ChevronRight,
  WifiOff,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Star,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Bot,
  Filter,
  Tag,
  Gift,
  Zap,
  Heart,
  Home,
  MoreHorizontal,
  MessageSquare,
  Mic,
  Disc,
  Database,
  BookHeart,
  Copy,
  Send,
  Smile,
  Frown,
  CloudRain,
  BookOpenText,
  Calendar,
  ClipboardList,
  Clock,
  Plus,
  Save,
  Volume2,
  VolumeX,
  Smartphone,
  SmartphoneOff,
  Layers,
  Brain,
  Flame,
  Trophy,
  Target,
  SkipBack,
  SkipForward,
  Settings,
  Repeat,
  Wifi,
  ExternalLink,
  Calculator,
  Receipt,
  LayoutGrid,
  Upload,
  Image,
  FileText,
  Pencil,
  Loader,
  X
};
