import React, { useMemo, useState, useEffect } from "react";
import { Home, Users, Sword, Users2, Book, ExternalLink } from "lucide-react"; // ⬅️ added ExternalLink

// Pokéliquid Dashboard
// Dark SPA with pagination sized to viewport.

const POKEMON_151 = [
    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
    "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
    "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok",
    "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran?", "Nidorina",
    "Nidoqueen", "Nidoran?", "Nidorino", "Nidoking", "Clefairy", "Clefable",
    "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat",
    "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth",
    "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck",
    "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath",
    "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp",
    "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel",
    "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro",
    "Magnemite", "Magneton", "Farfetch’d", "Doduo", "Dodrio", "Seel", "Dewgong",
    "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar",
    "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode",
    "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan",
    "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela",
    "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie",
    "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros",
    "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon",
    "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax",
    "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew"
];

// Unicode-aware helpers for search/sort
function normalizeKey(s: string): string {
    return s
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[\u0300-\u036f]/g, '')  // strip diacritics safely
        .replace(/[’'`]/g, '')            // normalize apostrophes
        .replace(/♀/g, 'female')
        .replace(/♂/g, 'male')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// Synthetic price history
function genPriceHistory(seed, points = 60) {
    const rand = (x) => { const s = Math.sin(x * 9301 + seed * 49297) * 43758.5453; return s - Math.floor(s); };
    let price = 0.01 + (seed % 10) * 0.005;
    const arr = [];
    for (let i = 0; i < points; i++) {
        const delta = (rand(i) - 0.45) * 0.02;
        price = Math.max(0.0001, price * (1 + delta));
        arr.push({ t: i, price });
    }
    return arr;
}

function LineSpark({ data, width = 300, height = 80 }) {
    const pad = 6;
    const points = useMemo(() => {
        if (!data || data.length === 0) return '';
        const prices = data.map(d => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = Math.max(1e-8, max - min);
        return data.map((d, i) => {
            const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
            const y = pad + (1 - (d.price - min) / range) * (height - 2 * pad);
            return `${x},${y}`;
        }).join(' ');
    }, [data, width, height]);

    const last = data[data.length - 1]?.price ?? 0;
    const first = data[0]?.price ?? last;
    const up = last >= first;
    const stroke = up ? '#00ff9d' : '#ff2e63';

    return (
        <svg width={width} height={height} className="block">
            <polyline fill="none" stroke={stroke} strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PokemonGraph({ pokemon, history }: {
    pokemon: string;
    history: { t: number; price: number; }[];
}) {
    const last = history[history.length - 1].price.toFixed(6);
    const first = history[0].price;
    const pct = ((history[history.length - 1].price - first) / first * 100).toFixed(2);

    return (
        <div className="bg-[#0d1117] border border-[#1f2937] rounded-xl p-4 shadow-lg flex flex-col relative hover:border-[#00ff9d] transition-colors">
            <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${POKEMON_151.indexOf(pokemon) + 1}.png`}
                alt={pokemon}
                className="w-12 h-12 absolute top-2 right-2 opacity-80"
            />
            <div className="flex items-center justify-between pr-14">
                <div>
                    <div className="text-base font-bold text-[#ffd004] tracking-wide">{pokemon}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-mono text-[#00eaff]">${last}</div>
                    <div className={`text-xs ${pct >= 0 ? 'text-[#00ff9d]' : 'text-[#ff2e63]'}`}>{pct}%</div>
                </div>
            </div>
            <div className="mt-2">
                <LineSpark data={history} width={360} height={80} />
            </div>
            <div className="mt-3 flex gap-2">
                <button className="flex-1 py-1.5 border border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d] hover:text-black font-bold rounded-md text-sm tracking-wide bg-transparent">Buy</button>
                <button className="flex-1 py-1.5 border border-[#ff2e63] text-[#ff2e63] hover:bg-[#ff2e63] hover:text-white font-bold rounded-md text-sm tracking-wide bg-transparent">Sell</button>
            </div>
        </div>
    );
}

function PokedexPage({ owned, page, setPage, perPage }: {
    owned: number[];
    page: number;
    setPage: (n: number) => void;
    perPage: number;
}) {
    const start = page * perPage;
    const end = Math.min(start + perPage, POKEMON_151.length);
    const slice = POKEMON_151.slice(start, end);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#ffd004]">Pokédex</h2>
                <span className="text-sm text-gray-400">Owned {owned.length}/{POKEMON_151.length}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4">
                {slice.map((name, idx) => {
                    const id = start + idx + 1;
                    const isOwned = owned.includes(id);
                    return (
                        <div key={id} className={`flex flex-col items-center p-2 rounded-lg border ${isOwned ? 'border-[#00ff9d] bg-[#0d1117]' : 'border-[#1f2937] bg-[#0d1117] opacity-40'} transition`}>
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                                alt={name}
                                className="w-16 h-16 mb-2"
                            />
                            <span className="text-xs font-mono text-gray-300">#{id}</span>
                            <span className="text-sm capitalize">{name}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center gap-4 mt-6">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-gray-500 rounded hover:bg-[#00eaff] hover:text-black disabled:opacity-30">Prev</button>
                <button disabled={end >= POKEMON_151.length} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-gray-500 rounded hover:bg-[#00eaff] hover:text-black disabled:opacity-30">Next</button>
            </div>
        </div>
    );
}

export default function PokeliquidDashboard() {
    const N = Math.min(151, POKEMON_151.length);
    const full = useMemo(() => {
        return Array.from({ length: N }).map((_, i) => {
            const pokemon = POKEMON_151[i];
            const history = genPriceHistory(i + 7, 90);
            return { id: i, pokemon, history, lastPrice: history[history.length - 1].price };
        });
    }, []);

    const [query, setQuery] = useState("");
    const [sort, setSort] = useState('top_gainers');
    const [activeTab, setActiveTab] = useState('market');
    const [marketPage, setMarketPage] = useState(0);
    const [pokedexPage, setPokedexPage] = useState(0);
    const [perPage, setPerPage] = useState(12);

    // mock wallet-owned pokemon IDs
    const owned = [1, 4, 7, 25, 26, 50, 52, 74];

    // adjust items per page based on viewport size
    useEffect(() => {
        function updatePerPage() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // rough estimate: 250px height per row, 300px width per card
            const rows = Math.floor((height - 250) / 250) + 1;
            const cols = width > 1280 ? 4 : width > 1024 ? 3 : width > 640 ? 2 : 1;
            const marketCount = Math.max(1, rows * cols);
            setPerPage(marketCount);
        }
        updatePerPage();
        window.addEventListener('resize', updatePerPage);
        return () => window.removeEventListener('resize', updatePerPage);
    }, []);

    const pokedexNames = useMemo(() => {
        if (!query.trim()) return POKEMON_151;
        const qn = normalizeKey(query);
        return POKEMON_151.filter(n => normalizeKey(n).includes(qn));
    }, [query]);

    const filtered = useMemo(() => {
        let arr = full.slice();
        if (query.trim()) {
            const qn = normalizeKey(query);
            arr = arr.filter(a => normalizeKey(a.pokemon).includes(qn)); // name-only, unicode-normalized
        }
        if (sort === 'top_gainers') {
            arr.sort((x, y) => {
                const xp = x.history[x.history.length - 1].price - x.history[0].price;
                const yp = y.history[y.history.length - 1].price - y.history[0].price;
                return yp - xp;
            });
        } else if (sort === 'top_price') {
            arr.sort((a, b) => b.lastPrice - a.lastPrice);
        } else if (sort === 'name_asc') {
            arr.sort((a, b) => a.pokemon.localeCompare(b.pokemon, 'en', { sensitivity: 'base', numeric: true }));
        }
        return arr;
    }, [full, query, sort]);

    const marketStart = marketPage * perPage;
    const marketEnd = Math.min(marketStart + perPage, filtered.length);
    const marketSlice = filtered.slice(marketStart, marketEnd);

    const pokedexPerPage = 60; // show more entries in grid without scroll

    return (
        <div className="flex min-h-screen bg-[#0a0f1c] text-white font-mono">
            {/* Sidebar */}
            <aside className="w-56 bg-[#111827] text-gray-200 flex flex-col items-center py-6 border-r border-[#1f2937]">
                <img src="https://i.imgur.com/vb93l3b.png" alt="Pokéliquid Logo" className="w-16 h-16 mb-8" />
                <nav className="flex flex-col gap-4 w-full px-4">
                    <button onClick={() => setActiveTab('market')} className={`flex items-center gap-2 px-3 py-2 rounded-md ${activeTab === 'market' ? 'bg-[#00ff9d] text-black font-bold' : 'hover:bg-[#00eaff] hover:text-black transition-colors'}`}><Home size={18} /> Market</button>
                    <button onClick={() => setActiveTab('pokedex')} className={`flex items-center gap-2 px-3 py-2 rounded-md ${activeTab === 'pokedex' ? 'bg-[#00ff9d] text-black font-bold' : 'hover:bg-[#00eaff] hover:text-black transition-colors'}`}><Book size={18} /> Pokédex</button>
                    <button onClick={() => setActiveTab('team')} className={`flex items-center gap-2 px-3 py-2 rounded-md ${activeTab === 'team' ? 'bg-[#00ff9d] text-black font-bold' : 'hover:bg-[#00eaff] hover:text-black transition-colors'}`}><Users size={18} /> My Team</button>
                    <button onClick={() => setActiveTab('battle')} className={`flex items-center gap-2 px-3 py-2 rounded-md ${activeTab === 'battle' ? 'bg-[#00ff9d] text-black font-bold' : 'hover:bg-[#00eaff] hover:text-black transition-colors'}`}><Sword size={18} /> Battle</button>
                    <button onClick={() => setActiveTab('dao')} className={`flex items-center gap-2 px-3 py-2 rounded-md ${activeTab === 'dao' ? 'bg-[#00ff9d] text-black font-bold' : 'hover:bg-[#00eaff] hover:text-black transition-colors'}`}><Users2 size={18} /> DAO</button>
                    {/* Documentation tab (opens GitBook) */}
                    <a
                        href="https://pokeliquid.gitbook.io/pokeliquid-docs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#00eaff] hover:text-black transition-colors"
                    >
                        <ExternalLink size={18} /> Documentation
                    </a>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 p-6">
                <header className="mb-6 flex items-center justify-between border-b border-[#1f2937] pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#00eaff] drop-shadow-lg tracking-widest">Pokéliquid</h1>
                        <p className="text-sm text-gray-400">Trade Spark-on-Bitcoin memecoins inspired by the original 151 Pokémon</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {(activeTab === 'market' || activeTab === 'pokedex') && (
                            <>
                                <input
                                    className="bg-[#0d1117] border border-[#1f2937] rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00eaff]"
                                    placeholder="Search Pokémon name…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-[#0d1117] border border-[#1f2937] rounded p-2 text-sm">
                                    <option value="top_gainers">Top Gainers</option>
                                    <option value="top_price">Top Price</option>
                                    <option value="name_asc">Name A→Z</option>
                                </select>
                            </>
                        )}
                        <button className="px-4 py-2 bg-[#00eaff] hover:bg-[#00cce0] text-black font-bold rounded-lg">Disconnect Wallet</button>
                    </div>
                </header>

                <main>
                    {activeTab === 'market' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {marketSlice.map(item => (
                                    <PokemonGraph key={item.id} pokemon={item.pokemon} history={item.history} />
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-6">
                                <button disabled={marketPage === 0} onClick={() => setMarketPage(marketPage - 1)} className="px-3 py-1 border border-gray-500 rounded hover:bg-[#00eaff] hover:text-black disabled:opacity-30">Prev</button>
                                <button disabled={marketEnd >= filtered.length} onClick={() => setMarketPage(marketPage + 1)} className="px-3 py-1 border border-gray-500 rounded hover:bg-[#00eaff] hover:text-black disabled:opacity-30">Next</button>
                            </div>
                        </>
                    )}
                    {activeTab === 'pokedex' && (
                        <PokedexPage owned={owned} page={pokedexPage} setPage={setPokedexPage} perPage={pokedexPerPage} />
                    )}
                    {activeTab === 'team' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {full.filter(item => owned.includes(item.id + 1)).map(item => (
                                <PokemonGraph key={item.id} pokemon={item.pokemon} history={item.history} />
                            ))}
                        </div>
                    )}
                    {activeTab === 'battle' && (
                        <div className="text-center text-gray-400 py-20">
                            <h2 className="text-2xl font-bold mb-4">Battle Arena</h2>
                            <p className="text-sm">Challenge other trainers and earn rewards!</p>
                        </div>
                    )}
                    {activeTab === 'dao' && (
                        <div className="text-center text-gray-400 py-20">
                            <h2 className="text-2xl font-bold mb-4">DAO</h2>
                            <p className="text-sm">Participate in governance and shape the future of Pokéliquid.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
