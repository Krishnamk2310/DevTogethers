import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";
import Editor from "@monaco-editor/react";
// Import icons
import {
  FiCopy,
  FiLogOut,
  FiUsers,
  FiCode,
  FiPlay,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { VscCode } from "react-icons/vsc";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start Code Here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const typingTimeoutRef = useRef(null);
  const [outPut, setOutPut] = useState("");
  const [version, setVersion] = useState("*");

  // New state to manage sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 11)}... is typing`);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });
    socket.on("codeResponse", (response) => {
      setOutPut(response.run.output);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      setJoined(true);
      socket.emit("join", { roomId, userName });
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Start Code Here");
    setLanguage("javascript");
    setIsSidebarOpen(false); // Close sidebar on leave
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const runCode = () => {
    socket.emit("compileCode", { code, roomId, language, version });
  };

  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200 font-sans p-4">
        <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-xl p-8 max-w-md w-full space-y-6">
          <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
            DevTogether
          </h1>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
          <input
            type="text"
            placeholder="Enter Your Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-teal-600 text-white py-3 rounded-md font-semibold hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors"
          >
            Join Collaboration
          </button>
        </div>
      </div>
    );
  }

  return (
    // FIX: Added `flex` class here to align children horizontally
    <div className="relative flex h-screen bg-gray-900 text-gray-300 font-sans overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden absolute top-4 left-4 z-30 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay for mobile (closes sidebar on click) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`w-72 bg-gray-800 border-r border-gray-700 p-6 flex flex-col flex-shrink-0 fixed lg:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
      >
        {/* Room Info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <VscCode size={28} className="text-teal-400" />
            <h2 className="text-2xl font-bold text-gray-100">DevTogether</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 truncate">
            Room ID: {roomId}
          </p>
          <button
            onClick={copyRoomId}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 text-gray-200 py-2 rounded-md font-medium hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500"
          >
            <FiCopy />
            <span>{copySuccess || "Copy Room ID"}</span>
          </button>
        </div>

        {/* Users List */}
        <div className="flex-grow mb-8 overflow-y-auto">
          <h3 className="flex items-center gap-2 text-gray-400 font-semibold mb-3 text-sm uppercase tracking-wider">
            <FiUsers />
            Active Users
          </h3>
          <ul className="space-y-3 text-gray-300">
            {users.map((user, index) => (
              <li
                key={index}
                className="flex items-center text-sm hover:text-white transition-colors"
              >
                <span className="h-2 w-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                <span className="truncate">{user}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Typing Indicator */}
        <p className="text-sm text-gray-500 italic h-5 mb-4 flex-shrink-0">
          {typing}
        </p>

        {/* Language Selector and Leave Button */}
        <div className="mt-auto space-y-4 flex-shrink-0">
          <div className="relative">
            <FiCode className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="w-full appearance-none p-2 pl-9 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
            onClick={leaveRoom}
          >
            <FiLogOut />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Main Content: Editor and Output */}
      <div className="flex flex-1 flex-col h-full p-2 sm:p-4 gap-4">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-gray-600">
          <div className="flex justify-between items-center bg-gray-700 px-4 py-2 border-b border-gray-600">
            <span className="text-sm font-medium text-gray-300">
              Code Editor (
              {language.charAt(0).toUpperCase() + language.slice(1)})
            </span>
            <button
              onClick={runCode}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-md text-sm transition-colors duration-200"
            >
              <FiPlay size={14} />
              <span>Execute</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 10 },
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="h-1/3 md:h-1/4 flex flex-col rounded-lg border border-gray-600 bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-600 bg-gray-700 rounded-t-lg">
            <h2 className="font-semibold text-sm">Output</h2>
          </div>
          <textarea
            className="w-full flex-1 p-4 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none"
            value={outPut}
            readOnly
            placeholder="Output will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default App;