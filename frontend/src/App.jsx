import React, { useState } from "react";
import io from "socket.io-client";
import "./App.css";
import Editor from '@monaco-editor/react';
import { useEffect } from "react";
import { useRef } from "react";

const socket = io("http://localhost:5000");

const App = () => {
    const [joined, setJoined] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [userName, setUserName] = useState("");
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState("// Start Code Here");
    const [copySuccess, setCopySuccess] = useState("");
    const [users,setUsers] = useState([])
    const [typing,setTyping] = useState("")
    const typingTimeoutRef = useRef(null);

    useEffect(()=>{
        socket.on("userJoined",(users)=>{
            setUsers(users);
        });
        socket.on("codeUpdate", (newCode) => {
            setCode(newCode);
        });
        socket.on("userTyping", (user) => {
            setTyping(`${user.slice(0, 11)}... is typing`);
            // Clear previous timeout if exists
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Set new timeout to clear typing indicator
            typingTimeoutRef.current = setTimeout(() => setTyping(""), 2000);
        });
        socket.on("languageUpdate",(newLanguage)=>{
            setLanguage(newLanguage);
        });
        return () => {
        socket.off("userJoined");
        socket.off("codeUpdate");
        socket.off("userTyping");
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket.off("languageUpdate")
    };
}, []);

useEffect(()=>{
    const handleBeforeUnload = () =>{
        socket.emit("leaveRoom");
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return ()=>{
        window.removeEventListener("beforeunload", handleBeforeUnload)
    };
},[]);

    const joinRoom = () => {
        if (roomId && userName) {
            setJoined(true);
            socket.emit("join", { roomId, userName });
        }
    };

    const leaveRoom = ()=>{
        socket.emit("leaveRoom");
        setJoined(false)
        setRoomId("")
        setUserName("")
        setCode("// Start Code Here")
        setLanguage("javascript")
    }

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        socket.emit("codeChange",{roomId,code: newCode});
        socket.emit("typing",{roomId,userName})
    };

    const handleLanguageChange =  e=>{
        const newLanguage = e.target.value
        setLanguage(newLanguage)
        socket.emit("languageChange",{roomId, language:newLanguage})
    }

    if (!joined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200 font-sans">
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
        <div className="flex h-screen bg-gray-900 text-gray-300 font-sans">
            {/* Sidebar */}
            <div className="w-72 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
                {/* Room Info */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-100 mb-1">
                        DevTogether
                    </h2>
                    <p className="text-sm text-gray-400 mb-4 truncate">Room ID: {roomId}</p>
                    <button
                        onClick={copyRoomId}
                        className="w-full bg-gray-700 text-gray-200 py-2 rounded-md font-medium hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500"
                    >
                        Copy Room ID
                    </button>
                    {copySuccess && <p className="text-sm text-green-400 mt-2 text-center">{copySuccess}</p>}
                </div>

                {/* Users List */}
                <div className="flex-grow mb-8">
                    <h3 className="text-gray-400 font-semibold mb-3 text-sm uppercase tracking-wider">Active Users</h3>
                    <ul className="space-y-2 text-gray-300">
                        {users.map((user,index)=>(
                            <li key={index} className="flex items-center"><span className="h-2 w-2 bg-green-500 rounded-full mr-3"></span>{user.slice(0,11)}...</li>
                        ))}
                    </ul>
                </div>

                {/* Typing Indicator */}
                <p className="text-sm text-gray-500 italic h-5 mb-4">{typing}</p>

                {/* Language Selector and Leave Button */}
                <div className="mt-auto space-y-4">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                    <button className="w-full bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500" onClick={leaveRoom}>
                        Leave Room
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4">
                <div className="h-full rounded-lg overflow-hidden border border-gray-700">
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
                            wordWrap: 'on',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;