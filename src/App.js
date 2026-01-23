import { useEffect, useState, useRef } from "react";
import styled from "styled-components/macro";
import Score from "./components/Score";
import Game from "./components/Game";
import Rules from "./components/Rules";

const JoinContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: white;
  font-family: "BSB";
  input {
    padding: 1rem;
    margin: 1rem;
    border-radius: 5px;
    border: none;
    width: 250px;
  }
  button {
    padding: 1rem 2rem;
    background: white;
    color: #3b4363;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: "BB";
    text-transform: uppercase;
  }
`;

function App() {
  const [score, setScore] = useState(0);
  const [roomInput, setRoomInput] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [forceReset, setForceReset] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:8765";
    socket.current = new WebSocket(wsUrl);

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "RESTART") setForceReset((prev) => !prev);
      if (data.type === "FULL_RESET") {
        setScore(0);
        setForceReset((prev) => !prev);
      }
      if (data.type === "ERROR") alert(data.msg);
    };

    socket.current.addEventListener("message", handleMessage);
    return () => socket.current?.removeEventListener("message", handleMessage);
  }, []);

  const handleJoin = () => {
    if (roomInput && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({ type: "JOIN_ROOM", room: roomInput }),
      );
      setIsJoined(true);
    }
  };

  const resetGame = () => {
    socket.current?.send(JSON.stringify({ type: "RESET" }));
  };

  return (
    <>
      <Score score={score} setScore={setScore} />
      {!isJoined ? (
        <JoinContainer>
          <h1>Enter Room Name</h1>
          <input
            type="text"
            placeholder="e.g. Group-A"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
          />
          <button onClick={handleJoin}>Join Game</button>
        </JoinContainer>
      ) : (
        <Game
          score={score}
          socket={socket}
          forceReset={forceReset}
          setScore={setScore}
          setScoreChange={() => {}}
        />
      )}
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
      >
        <button
          onClick={resetGame}
          style={{
            background: "transparent",
            border: "1px solid white",
            color: "white",
            padding: "0.5rem 2rem",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Reset Room
        </button>
      </div>
      <Rules />
    </>
  );
}

export default App;
