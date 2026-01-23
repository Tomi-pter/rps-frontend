import { useState, useEffect } from "react";
import styled from "styled-components/macro";
import rock from "../images/icon-rock.svg";
import paper from "../images/icon-paper.svg";
import scissors from "../images/icon-scissors.svg";
import triangle from "../images/bg-triangle.svg";

// styled components
const GamePiece = styled.button`
  padding: 1.5rem;
  width: 9vw;
  height: 9vw;
  border-radius: 50%;
  border: 16px solid var(--${(props) => props.$color}, transparent);
  box-shadow:
    inset 0 5px hsl(217, 16%, 45%, 0.5),
    0 5px var(--${(props) => props.$color}-shadow);
  background: url(${(props) => props.bg}) no-repeat center/3.5vw;
  background-color: white;
  color: transparent;
  transform: ${(props) => (props.animate === true ? "scale(1)" : "scale(0)")};
  transition: transform 1s ease-in-out;

  @media screen and (max-width: 1024px) {
    border: 13px solid var(--${(props) => props.$color}, transparent);
    max-width: 25vw;
    max-height: 25vh;
    background: url(${(props) => props.bg}) no-repeat center/2rem;
    background-color: white;
  }

  @media screen and (max-width: 700px) {
    background: url(${(props) => props.bg}) no-repeat center/1.5rem;
    background-color: white;
  }
`;

const GameOuter = styled.div`
  position: relative;
  margin: 3rem auto;
  max-width: 30%;
  height: 50vh;
  background: url(${triangle}) no-repeat center/20vw clamp(30vh, 37vh, 37.2vh);

  @media screen and (max-width: 1024px) {
    max-width: 60%;
    height: 32.5vh;
    background: url(${triangle}) no-repeat center/clamp(30vw, 55vw, 60vw)
      clamp(20vh, 25vh, 29vh);
  }

  ${GamePiece}:first-child {
    position: absolute;
    top: 0;
    left: 0;
  }
  ${GamePiece}:nth-child(2) {
    position: absolute;
    top: 0;
    right: 0;
  }
  ${GamePiece}:last-child {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const GameOuterActive = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 45%;
  margin: 1rem auto;

  & p {
    font-family: "BSB";
    margin-bottom: 1rem;
    color: white;
    text-align: center;
  }

  & .outcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: ${(props) => (props.animate === true ? "1" : "0")};
    transition: opacity 500ms ease-in 1.5s;
  }

  & .outcome > p {
    font-family: "BB";
    text-transform: uppercase;
    font-size: 3rem;
    color: white;
  }

  & .userDiv,
  & .houseContainer {
    position: relative;
  }

  & .userDiv button {
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      animation: ${(props) =>
        props.gameActive === true && props.champ === "user"
          ? "declareWinner 1.5s forwards 1.5s"
          : "none"};
    }
  }

  & .theHouse {
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      animation: ${(props) =>
        props.gameActive === true && props.champ === "house"
          ? "declareWinner 1.5s forwards 1.5s"
          : "none"};
    }
  }

  @keyframes declareWinner {
    33% {
      box-shadow: 0 6px 0 60px rgba(255, 255, 255, 0.025);
    }
    66% {
      box-shadow:
        0 6px 0 60px rgba(255, 255, 255, 0.025),
        0 6px 0 125px rgba(255, 255, 255, 0.025);
    }
    100% {
      box-shadow:
        0 6px 0 60px rgba(255, 255, 255, 0.025),
        0 6px 0 125px rgba(255, 255, 255, 0.025),
        0 6px 0 200px rgba(255, 255, 255, 0.025);
    }
  }

  @media screen and (max-width: 1024px) {
    max-width: 80%;
    height: 30vh;
    margin: auto;
    & p {
      font-size: 0.8rem;
    }
    & .outcome > p {
      font-size: 1.5rem;
    }
  }
`;

const OutcomeBtn = styled.button`
  padding: 0.5rem 3rem;
  margin: 0.5rem auto;
  color: var(--dark-text);
  background-color: white;
  text-transform: uppercase;
  border-radius: 0.25rem;
  font-family: "BB";
  border: 1px solid white;
  box-shadow: 2px 2px 2.5px rgba(0, 0, 0, 0.25);
  cursor: pointer;

  &:hover {
    color: red;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WaitingMessage = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7) !important;
  font-style: italic;
  margin-top: 0.5rem;
`;

const CHOICE_MAP = {
  1: { color: "paper", bg: paper },
  2: { color: "scissors", bg: scissors },
  3: { color: "rock", bg: rock },
};

function Game({ score, socket, forceReset, setScore, setScoreChange }) {
  const [active, setActive] = useState(false);
  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [gameResult, setGameResult] = useState("");
  const [isAnimated, setIsAnimated] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Sync with App.js for Resets
  useEffect(() => {
    setActive(false);
    setIsAnimated(false);
    setMyChoice(null);
    setOpponentChoice(null);
    setGameResult("");
    setWaitingForOpponent(false);
  }, [forceReset]);

  // WebSocket Listener for Results
  useEffect(() => {
    if (!socket.current) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "RESULT") {
        setOpponentChoice(data.opponentChoice);
        setGameResult(data.result);
        setIsAnimated(true);
        setWaitingForOpponent(false);

        // Score update with delay to match animation
        setTimeout(() => {
          if (data.result === "You win") setScore((prev) => prev + 1);
          if (data.result === "You lose") setScore((prev) => prev - 1);
        }, 2500);
      }

      if (data.type === "RESTART" || data.type === "FULL_RESET") {
        setActive(false);
        setIsAnimated(false);
        setMyChoice(null);
        setOpponentChoice(null);
        setGameResult("");
        setWaitingForOpponent(false);
      }
    };

    socket.current.addEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => socket.current?.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.current, setScore]);

  const handlePieceClick = (choiceId) => {
    const id = parseInt(choiceId);
    setMyChoice(id);
    setActive(true);
    setScoreChange(true);

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({ type: "MOVE", choice: id, isBonus: false }),
      );
    }
  };

  const handlePlayAgain = () => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "PLAY_AGAIN" }));
      setWaitingForOpponent(true);
    }
  };

  const getChampion = () => {
    if (gameResult === "You win") return "user";
    if (gameResult === "You lose") return "house";
    return "draw";
  };

  return (
    <>
      {!active ? (
        <GameOuter>
          <GamePiece
            $color="paper"
            bg={paper}
            id="1"
            onClick={(e) => handlePieceClick(e.target.id)}
            animate={true}
          >
            paper
          </GamePiece>
          <GamePiece
            $color="scissors"
            bg={scissors}
            id="2"
            onClick={(e) => handlePieceClick(e.target.id)}
            animate={true}
          >
            scissors
          </GamePiece>
          <GamePiece
            $color="rock"
            bg={rock}
            id="3"
            onClick={(e) => handlePieceClick(e.target.id)}
            animate={true}
          >
            rock
          </GamePiece>
        </GameOuter>
      ) : (
        <GameOuterActive
          animate={isAnimated}
          champ={getChampion()}
          gameActive={isAnimated}
        >
          <div className="userDiv">
            <p>YOU PICKED</p>
            <GamePiece
              $color={CHOICE_MAP[myChoice]?.color}
              bg={CHOICE_MAP[myChoice]?.bg}
              animate={true}
              disabled
            >
              {myChoice}
            </GamePiece>
          </div>
          <div className="outcome">
            <p className="result">{gameResult || "Waiting..."}</p>
            <OutcomeBtn onClick={handlePlayAgain} disabled={waitingForOpponent}>
              {waitingForOpponent ? "Waiting..." : "Play again"}
            </OutcomeBtn>
            {waitingForOpponent && (
              <WaitingMessage>Waiting for opponent...</WaitingMessage>
            )}
          </div>
          <div className="houseContainer">
            <p>THE HOUSE PICKED</p>
            <GamePiece
              className="theHouse"
              $color={CHOICE_MAP[opponentChoice]?.color || ""}
              bg={CHOICE_MAP[opponentChoice]?.bg || ""}
              animate={isAnimated}
              disabled
            >
              {opponentChoice}
            </GamePiece>
          </div>
        </GameOuterActive>
      )}
    </>
  );
}

export default Game;
