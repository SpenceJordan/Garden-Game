'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Plant {
  id: number;
  name: string;
  icon: string;
  growthStage: number;
  waterLevel: number;
  maxWater: number;
  growthTime: number;
  plantedAt: number;
}

interface Animal {
  id: number;
  name: string;
  icon: string;
  hunger: number;
  happiness: number;
}

interface GameState {
  coins: number;
  level: number;
  exp: number;
  plants: Plant[];
  animals: Animal[];
  nextId: number;
}

interface Feedback {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

const PLANT_ITEMS = [
  { name: 'Tomato Seeds', icon: '🍅', price: 10, growthTime: 30000 },
  { name: 'Carrot Seeds', icon: '🥕', price: 15, growthTime: 25000 },
  { name: 'Sunflower Seeds', icon: '🌻', price: 20, growthTime: 40000 },
  { name: 'Strawberry Seeds', icon: '🍓', price: 25, growthTime: 35000 },
  { name: 'Pumpkin Seeds', icon: '🎃', price: 30, growthTime: 50000 },
  { name: 'Rose Seeds', icon: '🌹', price: 40, growthTime: 45000 },
];

const ANIMAL_ITEMS = [
  { name: 'Rabbit', icon: '🐰', price: 50, happiness: 50, hunger: 50 },
  { name: 'Cat', icon: '🐱', price: 60, happiness: 50, hunger: 50 },
  { name: 'Dog', icon: '🐶', price: 70, happiness: 50, hunger: 50 },
  { name: 'Chicken', icon: '🐔', price: 40, happiness: 50, hunger: 50 },
  { name: 'Pig', icon: '🐷', price: 80, happiness: 50, hunger: 50 },
  { name: 'Duck', icon: '🦆', price: 45, happiness: 50, hunger: 50 },
];

const STAGE_ICONS = ['🌱', '🌿', '🌾'];
const STAGE_NAMES = ['Seed', 'Sprout', 'Growing', 'Harvestable'];

function withExp(state: GameState, amount: number): GameState {
  let exp = state.exp + amount;
  let level = state.level;
  const expToNext = level * 100;
  if (exp >= expToNext) {
    exp -= expToNext;
    level++;
  }
  return { ...state, exp, level };
}

export default function GardenGame() {
  const [gameState, setGameState] = useState<GameState>({
    coins: 15,
    level: 1,
    exp: 0,
    plants: [],
    animals: [],
    nextId: 1,
  });
  const [page, setPage] = useState<'garden' | 'shelter' | 'shop'>('garden');
  const [shopTab, setShopTab] = useState<'plants' | 'animals'>('plants');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpVal, setLevelUpVal] = useState(1);
  const feedbackId = useRef(0);
  const prevLevel = useRef(1);

  // Load saved game
  useEffect(() => {
    const saved = localStorage.getItem('gardenGame');
    if (saved) {
      try {
        const data = JSON.parse(saved) as GameState;
        if (data.coins === 0 && data.plants.length === 0 && data.animals.length === 0) {
          data.coins = 15;
        }
        prevLevel.current = data.level; // prevent false level-up on load
        setGameState(data);
      } catch {
        // keep default state
      }
    }
  }, []);

  // Save on state change
  useEffect(() => {
    localStorage.setItem('gardenGame', JSON.stringify(gameState));
  }, [gameState]);

  // Level-up detection
  useEffect(() => {
    if (gameState.level > prevLevel.current) {
      setLevelUpVal(gameState.level);
      setShowLevelUp(true);
    }
    prevLevel.current = gameState.level;
  }, [gameState.level]);

  // Animal decay loop
  useEffect(() => {
    const id = setInterval(() => {
      setGameState(prev => {
        const animals = prev.animals.map(a => ({
          ...a,
          hunger: Math.min(a.hunger + 1, 100),
          happiness: Math.max(a.happiness - 0.5, 0),
        }));
        const bonus = animals.filter(a => a.happiness > 70 && Math.random() > 0.7).length * 2;
        return { ...prev, animals, coins: prev.coins + bonus };
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const addFeedback = useCallback((text: string, x: number, y: number, color: string) => {
    const id = feedbackId.current++;
    setFeedbacks(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);

  const waterPlant = (id: number, e: React.MouseEvent) => {
    setGameState(prev => {
      const plants = prev.plants.map(p => {
        if (p.id !== id) return p;
        let waterLevel = Math.min(p.waterLevel + 25, p.maxWater);
        let growthStage = p.growthStage;
        if (waterLevel >= p.maxWater && growthStage < 3) {
          growthStage++;
          waterLevel = 0;
        }
        return { ...p, waterLevel, growthStage };
      });
      return withExp({ ...prev, plants }, 5);
    });
    addFeedback('+5 EXP', e.clientX, e.clientY, 'var(--accent-yellow)');
  };

  const harvestPlant = (id: number, e: React.MouseEvent) => {
    const coinsPreview = 20 + gameState.level * 5;
    setGameState(prev => {
      const plant = prev.plants.find(p => p.id === id);
      if (!plant) return prev;
      const earned = 20 + prev.level * 5;
      const plants = prev.plants.filter(p => p.id !== id);
      return withExp({ ...prev, plants, coins: prev.coins + earned }, 25);
    });
    addFeedback(`+${coinsPreview} 💰`, e.clientX, e.clientY, 'var(--accent-orange)');
    setTimeout(() => addFeedback('+25 EXP', e.clientX, e.clientY + 30, 'var(--accent-yellow)'), 100);
  };

  const feedAnimal = (id: number, e: React.MouseEvent) => {
    setGameState(prev => {
      const animals = prev.animals.map(a =>
        a.id === id ? { ...a, hunger: Math.max(a.hunger - 20, 0) } : a
      );
      return withExp({ ...prev, animals }, 5);
    });
    addFeedback('+5 EXP', e.clientX, e.clientY, 'var(--accent-yellow)');
  };

  const playWithAnimal = (id: number, e: React.MouseEvent) => {
    setGameState(prev => {
      const animals = prev.animals.map(a =>
        a.id === id ? { ...a, happiness: Math.min(a.happiness + 15, 100) } : a
      );
      return withExp({ ...prev, animals }, 10);
    });
    addFeedback('+10 EXP', e.clientX, e.clientY, 'var(--accent-yellow)');
  };

  const buyPlant = (index: number, e: React.MouseEvent) => {
    const item = PLANT_ITEMS[index];
    if (gameState.coins < item.price) return;
    setGameState(prev => {
      if (prev.coins < item.price) return prev;
      const plant: Plant = {
        id: prev.nextId,
        name: item.name,
        icon: item.icon,
        growthStage: 0,
        waterLevel: 0,
        maxWater: 100,
        growthTime: item.growthTime,
        plantedAt: Date.now(),
      };
      return { ...prev, coins: prev.coins - item.price, plants: [...prev.plants, plant], nextId: prev.nextId + 1 };
    });
    addFeedback('🌱 Seeds purchased!', e.clientX, e.clientY, 'var(--grass)');
    setTimeout(() => addFeedback(`-${item.price} 💰`, e.clientX, e.clientY + 40, 'var(--accent-orange)'), 100);
  };

  const buyAnimal = (index: number, e: React.MouseEvent) => {
    const item = ANIMAL_ITEMS[index];
    if (gameState.coins < item.price) return;
    setGameState(prev => {
      if (prev.coins < item.price) return prev;
      const animal: Animal = {
        id: prev.nextId,
        name: item.name,
        icon: item.icon,
        hunger: item.hunger,
        happiness: item.happiness,
      };
      return { ...prev, coins: prev.coins - item.price, animals: [...prev.animals, animal], nextId: prev.nextId + 1 };
    });
    addFeedback('🐾 Animal adopted!', e.clientX, e.clientY, 'var(--accent-pink)');
    setTimeout(() => addFeedback(`-${item.price} 💰`, e.clientX, e.clientY + 40, 'var(--accent-orange)'), 100);
  };

  const expToNext = gameState.level * 100;
  const expPercent = Math.min((gameState.exp / expToNext) * 100, 100);

  return (
    <>
      {feedbacks.map(f => (
        <div key={f.id} className="float-feedback" style={{ left: f.x, top: f.y, color: f.color }}>
          {f.text}
        </div>
      ))}

      {showLevelUp && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-title">🎉 Level Up!</div>
            <div className="modal-text">
              Congratulations! You&apos;ve reached level {levelUpVal}!
            </div>
            <button className="modal-btn" onClick={() => setShowLevelUp(false)}>Continue</button>
          </div>
        </div>
      )}

      <div className="header">
        <div className="header-content">
          <h1 className="title">🌱 My Little Garden &amp; Shelter 🐰</h1>
          <nav className="nav">
            <button className={`nav-btn${page === 'garden' ? ' active' : ''}`} onClick={() => setPage('garden')}>
              🌿 Garden
            </button>
            <button className={`nav-btn${page === 'shelter' ? ' active' : ''}`} onClick={() => setPage('shelter')}>
              🏡 Shelter
            </button>
            <button className={`nav-btn${page === 'shop' ? ' active' : ''}`} onClick={() => setPage('shop')}>
              🏪 Shop
            </button>
          </nav>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Coins:</span>
              <span className="stat-value">{gameState.coins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{gameState.level}</span>
            </div>
            <div className="stat-item">
              <div className="exp-container">
                <div className="exp-bar-bg">
                  <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
                </div>
                <div className="exp-text">{gameState.exp} / {expToNext} EXP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {page === 'garden' && (
          <div className="page-section active">
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">🌿 My Garden</h2>
                <button className="add-btn" onClick={() => setPage('shop')}>🛒 Buy Seeds</button>
              </div>
              <div className="grid">
                {gameState.plants.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🌱</div>
                    <p>Your garden is empty! Visit the shop to buy some seeds.</p>
                    <button className="empty-btn" onClick={() => setPage('shop')}>Go to Shop</button>
                  </div>
                ) : gameState.plants.map(plant => {
                  const icon = plant.growthStage < 3 ? STAGE_ICONS[plant.growthStage] : plant.icon;
                  const waterPercent = (plant.waterLevel / plant.maxWater) * 100;
                  return (
                    <div key={plant.id} className="plant-card">
                      <div className="plant-icon">{icon}</div>
                      <div className="plant-name">{plant.name}</div>
                      <div className="plant-stage">{STAGE_NAMES[plant.growthStage]}</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${waterPercent}%` }} />
                      </div>
                      <div className="action-buttons">
                        {plant.growthStage < 3 ? (
                          <button className="action-btn" onClick={e => waterPlant(plant.id, e)}>💧 Water</button>
                        ) : (
                          <button className="action-btn harvest" onClick={e => harvestPlant(plant.id, e)}>✨ Harvest</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {page === 'shelter' && (
          <div className="page-section active">
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">🐾 My Animals</h2>
                <button className="add-btn" onClick={() => setPage('shop')}>🛒 Adopt Animals</button>
              </div>
              <div className="grid">
                {gameState.animals.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🐾</div>
                    <p>Your shelter is empty! Visit the shop to adopt some animals.</p>
                    <button className="empty-btn" onClick={() => setPage('shop')}>Go to Shop</button>
                  </div>
                ) : gameState.animals.map(animal => (
                  <div key={animal.id} className="animal-card">
                    <div className="animal-icon">{animal.icon}</div>
                    <div className="animal-name">{animal.name}</div>
                    <div className="animal-stat">😊 Happiness: {Math.round(animal.happiness)}%</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${animal.happiness}%`, background: 'linear-gradient(90deg, var(--accent-pink) 0%, var(--accent-orange) 100%)' }} />
                    </div>
                    <div className="animal-stat">🍖 Hunger: {Math.round(animal.hunger)}%</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${100 - animal.hunger}%`, background: 'linear-gradient(90deg, var(--accent-yellow) 0%, var(--accent-orange) 100%)' }} />
                    </div>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={e => feedAnimal(animal.id, e)}>🍖 Feed</button>
                      <button className="action-btn" onClick={e => playWithAnimal(animal.id, e)}>🎾 Play</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'shop' && (
          <div className="page-section active">
            <div className="shop-section">
              <h2 className="shop-title">🏪 Shop</h2>
              <div className="shop-tabs">
                <button className={`shop-tab${shopTab === 'plants' ? ' active' : ''}`} onClick={() => setShopTab('plants')}>
                  🌱 Plants
                </button>
                <button className={`shop-tab${shopTab === 'animals' ? ' active' : ''}`} onClick={() => setShopTab('animals')}>
                  🐾 Animals
                </button>
              </div>
              <div className="shop-grid">
                {shopTab === 'plants' ? PLANT_ITEMS.map((item, index) => {
                  const canAfford = gameState.coins >= item.price;
                  return (
                    <div key={item.name} className="shop-item">
                      <div className="shop-item-icon">{item.icon}</div>
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-price">💰 {item.price} coins</div>
                      <button className="buy-btn" disabled={!canAfford} onClick={e => buyPlant(index, e)}>
                        {canAfford ? 'Buy' : 'Not enough coins'}
                      </button>
                    </div>
                  );
                }) : ANIMAL_ITEMS.map((item, index) => {
                  const canAfford = gameState.coins >= item.price;
                  return (
                    <div key={item.name} className="shop-item">
                      <div className="shop-item-icon">{item.icon}</div>
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-price">💰 {item.price} coins</div>
                      <button className="buy-btn" disabled={!canAfford} onClick={e => buyAnimal(index, e)}>
                        {canAfford ? 'Buy' : 'Not enough coins'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
