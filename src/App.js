import { useEffect, useState, useRef } from "react";
import styled from "styled-components/macro";
import Score from "./components/Score";
import Game from "./components/Game";
import Rules from "./components/Rules";

const ResetDiv = styled.div`
  display: flex;
  margin: 1rem 0.5rem 1rem 0;
  justify-content: center;
`;

const ResetBtn = styled.button`
  background-color: rgb(255, 255, 255, 0);
  padding: 0.5rem 2rem;
  color: white;
  border: 1px solid white;
  border-radius: 0.35rem;
  font-family: "BSB";
  display: block;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

function App() {
  const [score, setScore] = useState(0);
  const [scoreChange, setScoreChange] = useState(false);
  const [forceReset, setForceReset] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    // Use environment variable or fallback to localhost for development
    const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:8765";
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      console.log("✅ Connected to game server");
    };

    // Use addEventListener instead of onmessage so both App and Game can receive messages
    const handleAppMessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📨 App.js received:", data);

      if (data.type === "RESTART") {
        setForceReset((prev) => !prev);
      }
      if (data.type === "FULL_RESET") {
        setScore(0);
        setForceReset((prev) => !prev);
      }
    };

    socket.current.addEventListener("message", handleAppMessage);

    socket.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socket.current.onclose = (event) => {
      console.log(
        "🔌 Disconnected from game server. Code:",
        event.code,
        "Reason:",
        event.reason,
      );
    };

    return () => {
      if (socket.current) {
        socket.current.removeEventListener("message", handleAppMessage);
        if (socket.current.readyState === WebSocket.OPEN) {
          socket.current.close();
        }
      }
    };
  }, []);

  const resetGame = () => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "RESET" }));
    }
  };

  return (
    <>
      <Score score={score} setScore={setScore} scoreChange={scoreChange} />
      <Game
        score={score}
        socket={socket}
        forceReset={forceReset}
        setScore={setScore}
        setScoreChange={setScoreChange}
      />
      <ResetDiv>
        <ResetBtn onClick={resetGame}>Reset</ResetBtn>
      </ResetDiv>
      <Rules />
    </>
  );
}

export default App;
