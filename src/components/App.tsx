import {useWindowSize} from "../hooks/useWindowSize";
import {Fragment, useState} from "react";
import {useInterval} from "../hooks/useInterval";
import {GameState} from "../types/GameState";
import {useEventListener} from "../hooks/useEventListener";
import {Point} from "../types/Point";

const borderWidth = 4;

export const App = () => {
    const {width, height} = useWindowSize();
    const cellSize = Math.min(width / 10, height / 11);

    const [gameState, setGameState] = useState(GameState.Init);
    const [snake, setSnake] = useState<Point[]>([{x: 0, y: 0}]);
    const [direction, setDirection] = useState<Point>({x: 0, y: -1});
    const [prize, setPrize] = useState<Point | undefined>(undefined);
    const [isBlack, setIsBlack] = useState(false);
    const [remainingGrow, setRemainingGrow] = useState(0);
    const [record, setRecord] = useState(Number(window.localStorage.kropkiSnakeRecord || 0));

    const [head, neck] = snake;

    const setSnakeAndRecord = (snake: Point[]) => {
        setSnake(snake);

        if (snake.length > record) {
            setRecord(snake.length);
            window.localStorage.kropkiSnakeRecord = snake.length;
        }
    }

    const genPrize = (snake: Point[]) => {
        const possibilities: Point[] = [];

        for (let x = 0; x <= 8; x += 0.5) {
            for (let y = (x + 0.5) % 1; y <= 8; y += 1) {
                if (snake.every(({x: snakeX, y: snakeY}) => Math.abs(x - snakeX) >= 1 || Math.abs(y - snakeY) >= 1)) {
                    possibilities.push({x, y});
                }
            }
        }

        setPrize(possibilities[Math.floor(Math.random() * possibilities.length)]);
        setIsBlack(Math.random() < 0.06);
        setRemainingGrow(0);
    }

    useInterval(200, () => {
        if (gameState !== GameState.Started) {
            return;
        }

        const newX = head.x + direction.x;
        const newY = head.y + direction.y;
        if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9 || snake.some(({x, y}) => x === newX && y === newY)) {
            setGameState(GameState.Finished);
            return;
        }

        const newSnake = [{x: newX, y: newY}, ...snake];

        if (remainingGrow !== 0) {
            setRemainingGrow(remainingGrow - 1);
            if (remainingGrow === 1) {
                genPrize(newSnake);
            }
        } else if (prize && (newX + head.x) / 2 === prize.x && (newY + head.y) / 2 === prize.y) {
            const newRemainingGrow = isBlack ? snake.length * 2 - newSnake.length : 0;
            setRemainingGrow(newRemainingGrow);
            if (newRemainingGrow === 0) {
                genPrize(newSnake);
            }
        } else {
            newSnake.pop();
        }

        setSnakeAndRecord(newSnake);

        if (prize === undefined) {
            genPrize(newSnake);
        }
    });

    const handleArrow = (dirX: number, dirY: number) => {
        if (!neck || neck.x !== head.x + dirX || neck.y !== head.y + dirY) {
            setDirection({x: dirX, y: dirY});
        }
    };

    const handlePlayPause = () => {
        if (gameState === GameState.Started) {
            setGameState(GameState.Paused);
            return;
        }

        if (gameState === GameState.Paused) {
            setGameState(GameState.Started);
            return;
        }

        const newSnake = [{x: 4, y: 8}];
        setGameState(GameState.Started);
        setSnakeAndRecord(newSnake);
        setDirection({x: 0, y: -1});
        genPrize(newSnake);
    };

    useEventListener(window, "keydown", (ev: KeyboardEvent) => {
        switch (ev.code) {
            case "ArrowLeft":
            case "KeyA":
                handleArrow(-1, 0);
                break;
            case "ArrowRight":
            case "KeyD":
                handleArrow(1, 0);
                break;
            case "ArrowUp":
            case "KeyW":
                handleArrow(0, -1);
                break;
            case "ArrowDown":
            case "KeyS":
                handleArrow(0, 1);
                break;
            case "Space":
            case "KeyP":
                handlePlayPause();
                ev.preventDefault();
                break;
        }
    });

    return <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
    }}>
        <div style={{
            position: "absolute",
            left: (width - cellSize * 10) / 2,
            top: cellSize / 2,
        }}>
            <div
                style={{
                    position: "absolute",
                    left: -borderWidth / 2,
                    top: -borderWidth / 2,
                    width: cellSize * 9 + borderWidth,
                    height: cellSize * 0.5 + borderWidth,
                    fontFamily: "Lato, Arial",
                    fontSize: cellSize * 0.4,
                    lineHeight: `${cellSize * 0.5 + borderWidth}px`,
                }}
            >
                <div style={{position: "absolute"}}>
                    Record: {record}
                </div>

                {gameState !== GameState.Init && <div style={{
                    position: "absolute",
                    left: cellSize * 3 + borderWidth / 2,
                }}>
                    Length: {snake.length}
                </div>}

                <button
                    type={"button"}
                    style={{
                        position: "absolute",
                        right: 0,
                        width: cellSize * 3 + borderWidth,
                        height: cellSize * 0.5 + borderWidth,
                        border: `${borderWidth}px solid black`,
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        lineHeight: `${cellSize * 0.5 - borderWidth}px`,
                    }}
                    onClick={handlePlayPause}
                >
                    {gameState === GameState.Started ? "Pause" : "Start"}
                </button>
            </div>

            <svg
                style={{
                    position: "absolute",
                    left: -cellSize / 2,
                    top: cellSize / 2,
                    width: cellSize * 10,
                    height: cellSize * 10,
                }}
                viewBox={"-0.5 -0.5 10 10"}
            >
                {gameState !== GameState.Init && snake.map(({x, y}) => <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={1}
                    height={1}
                    fill={gameState === GameState.Finished ? "#f00" : "#0f0"}
                    stroke={"none"}
                    strokeWidth={0}
                />)}

                <rect
                    x={0}
                    y={0}
                    width={9}
                    height={9}
                    stroke={"black"}
                    strokeWidth={borderWidth / cellSize}
                    fill={"none"}
                />

                {[1, 2, 3, 4, 5, 6, 7, 8].map(index => <Fragment key={index}>
                    <line
                        x1={0}
                        y1={index}
                        x2={9}
                        y2={index}
                        stroke={"black"}
                        strokeWidth={(index % 3 ? 1 : borderWidth) / cellSize}
                    />

                    <line
                        x1={index}
                        y1={0}
                        x2={index}
                        y2={9}
                        stroke={"black"}
                        strokeWidth={(index % 3 ? 1 : borderWidth) / cellSize}
                    />
                </Fragment>)}

                {prize && <circle
                    cx={prize.x + 0.5}
                    cy={prize.y + 0.5}
                    r={0.2}
                    stroke={"black"}
                    strokeWidth={2 / cellSize}
                    fill={isBlack ? "black" : "white"}
                />}
            </svg>
        </div>
    </div>
};
