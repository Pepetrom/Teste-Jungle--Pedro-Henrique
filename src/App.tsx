import { useState, useEffect, useRef } from "react";
import { GameApp } from "./game/GameApp";
import { GameConfig } from "./game/GameConfig";

type Screen = "MENU" | "OPTIONS" | "GAME" | "RESULT" | "PAUSE";

export default function App() {
    const [screen, setScreen] = useState<Screen>("MENU");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resultReason, setResultReason] = useState("");
    const [resultTime, setResultTime] = useState(0);

    const [matchDuration, setMatchDuration] = useState(120);
    const [spawnInterval, setSpawnInterval] = useState(3.0);

    const pixiContainerRef = useRef<HTMLDivElement>(null);
    const gameAppRef = useRef<GameApp | null>(null);

    // Load player configs as the game is oppened
    useEffect(() => {
        const savedDuration = localStorage.getItem("matchDuration");
        const savedSpawn = localStorage.getItem("spawnInterval");
        if (savedDuration) setMatchDuration(Number(savedDuration));
        if (savedSpawn) setSpawnInterval(Number(savedSpawn));
    }, []);

    // Main Game update
    useEffect(() => {
        if (screen === "GAME" && pixiContainerRef.current && !gameAppRef.current) 
        {
            GameConfig.matchDuration = matchDuration;
            GameConfig.spawnInterval = spawnInterval;

            gameAppRef.current = new GameApp(
                pixiContainerRef.current,
                (reason, finalScore, time) => 
                {
                    setResultReason(reason);
                    setScore(finalScore);
                    setResultTime(time);
                    setScreen("RESULT");
                },
                (currentScore, currentTime) => 
                {
                    setScore(currentScore);
                    setTimeLeft(currentTime);
                }
            );
        }

        return () => {
            if (screen !== "GAME" && screen !== "PAUSE" && gameAppRef.current) {
                gameAppRef.current.destroy();
                gameAppRef.current = null;
            }
        };
    }, [screen]);

    useEffect(() => {
        const handleBlur = () => {
            if (screen === "GAME") {
                setScreen("PAUSE");
            }
        };
        const handleVisibilityChange = () => {
            if (document.hidden && screen === "GAME") {
                setScreen("PAUSE");
            }
        };
        window.addEventListener("blur", handleBlur);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [screen]);

    // Controlls Pause and Resume, changing the gameTime
    useEffect(() => {
        if (gameAppRef.current) {
            if (screen === "PAUSE") {
                gameAppRef.current.app.ticker.stop();
            } else if (screen === "GAME") {
                gameAppRef.current.app.ticker.start();
            }
        }
    }, [screen]);

    return (
        <>
            {screen === "MENU" && (
                <div className="screen-container ">
                    <div className="panel" style={{ width: "600px", height: "600px" }}>
                        <img src="/assets/png/default/ui/menu/title_pirate_battle.png"
                        alt="Pirate Battle" 
                        className="title-logo"/>
                        <button className="button"
                            onClick={() => setScreen("GAME")}> 
                            Play
                        </button>
                        <button className="button secondary"
                            onClick={() => setScreen("OPTIONS")}> 
                            Options
                        </button>
                    </div>
                </div>
            )}

            {screen === "OPTIONS" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "600px", height: "600px" }}>
                        <h1 className="title" style={{ fontSize: "3rem" }}>
                            Options
                        </h1>
                        <div style={{ marginBottom: "1rem", width: "80%" }}>
                            <label style={{
                                    display: "block",
                                    marginBottom: "0.5rem" }}>
                                Game Session Time (seconds): {matchDuration}
                            </label>
                            <input type="range"
                                min="60"
                                max="180"
                                step="10"
                                value={matchDuration}
                                onChange={(e) =>
                                    setMatchDuration(Number(e.target.value))
                                }
                                style={{ width: "100%" }}/>
                        </div>
                        <div style={{ marginBottom: "2rem", width: "80%" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem"}}>
                                Enemy Spawn Time (seconds): {spawnInterval}
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5.0"
                                step="0.5"
                                value={spawnInterval}
                                onChange={(e) =>
                                    setSpawnInterval(Number(e.target.value))
                                }
                                style={{ width: "100%" }}/>
                        </div>
                        <button className="button"
                            onClick={() => {
                                localStorage.setItem(
                                    "matchDuration",
                                    matchDuration.toString()
                                );
                                localStorage.setItem(
                                    "spawnInterval",
                                    spawnInterval.toString()
                                );
                                setScreen("MENU");}}>
                            Save & Back
                        </button>
                    </div>
                </div>
            )}

            {(screen === "GAME" || screen === "PAUSE") && (
                <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}>
                    <div ref={pixiContainerRef}
                        style={{ width: "100%", height: "100%" }}/>
                    <div style={{
                            position: "absolute",
                            top: 20,
                            left: 20,
                            zIndex: 20,
                            color: "white",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
                        <h2>Score: {score}</h2>
                        <h2>Time: {timeLeft}s</h2>
                    </div>
                    <button className="button" style={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            zIndex: 20,
                            padding: "0.5rem 1.5rem",
                            fontSize: "1rem"}}
                        onClick={() => setScreen("PAUSE")}>
                        Pause
                    </button>

                    <div style={{
                        position: "absolute",
                        bottom: 20,
                        left: 20,
                        zIndex: 20,
                        background: "rgba(30, 41, 59, 0.7)",
                        padding: "1rem",
                        borderRadius: "12px",
                        color: "white",
                        fontFamily: "'Outfit', sans-serif",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                    }}>
                        <h3 style={{ marginBottom: "0.5rem", color: "#60a5fa" }}>🎮 Comandos:</h3>
                        <p style={{ margin: "0.2rem 0" }}><b>WASD / Setas</b> : Mover e Girar</p>
                        <p style={{ margin: "0.2rem 0" }}><b>Espaço</b> : Atirar (Frente)</p>
                        <p style={{ margin: "0.2rem 0" }}><b>Q</b> / <b>E</b> : Atirar (Laterais)</p>
                    </div>
                </div>
            )}

            {screen === "PAUSE" && (
                <div className="screen-container"
                    style={{ background: "rgba(0,0,0,0.7)", zIndex: 30 }}>
                    <div className="panel" style={{ width: "600px", height: "600px" }}>
                        <h1 className="title" style={{ fontSize: "3rem" }}>
                            Paused
                        </h1>
                        <button className="button"
                            onClick={() => setScreen("GAME")}>
                            Resume
                        </button>
                        <button className="button"
                            onClick={() => {
                                if (gameAppRef.current) {
                                    gameAppRef.current.destroy();
                                    gameAppRef.current = null;
                                }
                                setScreen("MENU");
                            }}>
                            Abandon Match
                        </button>
                    </div>
                </div>
            )}

            {screen === "RESULT" && (
                <div className="screen-container">
                    <div className="panel" style={{ width: "600px", height: "600px" }}>
                        <h1 className="title" style={{ fontSize: "3rem" }}>
                            Game Over
                        </h1>
                        <h2 style={{ marginBottom: "1rem" }}>Score: {score}</h2>
                        <h3 style={{ marginBottom: "1rem" }}>
                            Time Played: {resultTime}s
                        </h3>
                        {resultReason && (
                            <p style={{
                                    marginBottom: "2rem",
                                    color: "var(--negative)",
                                }}>
                                {resultReason}
                            </p>)}
                        <button className="button"
                            onClick={() => setScreen("GAME")}>
                            Play Again
                        </button>
                        <button className="button"
                            onClick={() => setScreen("MENU")}>
                            Main Menu
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
