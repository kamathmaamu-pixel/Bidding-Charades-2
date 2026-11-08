// Shared data: movies + team quiz. Difficulty: 1 easy, 2 medium, 3 hard.
const LANGS = {
  hi: { name: 'Bollywood', emoji: '🎬' },
  ta: { name: 'Tamil', emoji: '🎭' },
  en: { name: 'Hollywood', emoji: '🍿' },
  kn: { name: 'Kannada', emoji: '🌟' },
};

const RAW = {
  hi: `Sholay|1;Dilwale Dulhania Le Jayenge|1;Kuch Kuch Hota Hai|1;3 Idiots|1;Lagaan|1;Dangal|1;PK|1;Dhoom|1;Dhoom 2|1;Chennai Express|1;Bajrangi Bhaijaan|1;Kabhi Khushi Kabhie Gham|1;Zindagi Na Milegi Dobara|1;Gully Boy|1;Munna Bhai MBBS|1;Don|1;Jawan|1;Pathaan|1;Animal|1;Kabir Singh|1;Chak De India|1;Om Shanti Om|1;Devdas|1;Mr India|1;Krrish|1;Golmaal|1;Hera Pheri|1;Bhool Bhulaiyaa|1;Kal Ho Naa Ho|1;Tiger Zinda Hai|1;Sultan|1;Housefull|1;Yeh Jawaani Hai Deewani|1;Student of the Year|1;Stree|1;Barfi|2;Queen|2;Andhadhun|2;Swades|2;Rang De Basanti|2;Taare Zameen Par|2;Jab We Met|2;Rockstar|2;Dil Chahta Hai|2;Andaz Apna Apna|2;Padmaavat|2;Bajirao Mastani|2;Race|2;Welcome|2;Jolly LLB|2;Bhaag Milkha Bhaag|2;Kahaani|2;Ra One|2;Dil Se|2;Veer-Zaara|2;Hum Aapke Hain Koun|2;Border|2;Kaho Naa Pyaar Hai|2;Fashion|2;Drishyam|2;Raazi|2;Article 15|3;Tumbbad|3;Wake Up Sid|3;Mughal-E-Azam|3;Mother India|3;Pyaasa|3;Guide|3;Anand|3;Jaane Bhi Do Yaaro|3;Mera Naam Joker|3;Gangs of Wasseypur|3;Haider|3;Piku|3;Badhaai Do|3;Tamasha|3;Lootera|3;Masaan|3;Newton|3;Lunchbox|3`,
  ta: `Enthiran|1;Vikram|1;Master|1;Jailer|1;Leo|1;Anniyan|1;Sivaji|1;Kabali|1;Mersal|1;Theri|1;Bigil|1;Thuppakki|1;Ghajini|1;Padayappa|1;Baasha|1;Varisu|1;Singam|1;Kaithi|2;Ponniyin Selvan|2;Kaala|2;Asuran|2;Soorarai Pottru|2;96|2;Vikram Vedha|2;Kaakha Kaakha|2;Vaaranam Aayiram|2;Alaipayuthey|2;Roja|2;Bombay|2;Thalapathi|2;Muthu|2;Indian|2;Mudhalvan|2;Jai Bhim|2;Maharaja|2;Love Today|2;Dragon|2;Vettaiyan|2;Amaran|2;Good Bad Ugly|2;Viswasam|2;Vedalam|2;Mankatha|2;Billa|2;Veeram|2;Sarkar|2;Thunivu|2;Kanchana|2;Doctor|2;Thani Oruvan|2;Dasavathaaram|2;Vishwaroopam|2;Thirupaachi|2;Vada Chennai|3;Super Deluxe|3;Remo|3;Nayakan|3;Pariyerum Perumal|3;Ayan|3;Kolamaavu Kokila|3;Aruvi|3;Mookuthi Amman|3;Jigarthanda|3;Anbe Sivam|3;Kadhalikka Neramillai|3;Michael Madana Kama Rajan|3;Oru Kal Oru Kannadi|3;Kadhal Kondein|3;Paruthiveeran|3;Aadukalam|3`,
  en: `Titanic|1;Avatar|1;The Dark Knight|1;Jurassic Park|1;Jaws|1;The Lion King|1;Frozen|1;Toy Story|1;Finding Nemo|1;Shrek|1;Harry Potter|1;Avengers Endgame|1;Iron Man|1;Spider-Man|1;Black Panther|1;Star Wars|1;Home Alone|1;Top Gun|1;Pirates of the Caribbean|1;The Lord of the Rings|1;Fast and Furious|1;Mission Impossible|1;Barbie|1;Up|1;Coco|1;Moana|1;Aladdin|1;Jumanji|1;Kung Fu Panda|1;Madagascar|1;Despicable Me|1;Minions|1;Cars|1;Deadpool|1;Terminator|1;The Incredibles|1;Monsters Inc|1;Ice Age|1;How to Train Your Dragon|1;The Hunger Games|1;Inception|2;Interstellar|2;The Matrix|2;The Godfather|2;Forrest Gump|2;Gladiator|2;Ghostbusters|2;Back to the Future|2;E.T.|2;Rocky|2;Skyfall|2;Mean Girls|2;The Hangover|2;Oppenheimer|2;Ratatouille|2;Mamma Mia|2;Grease|2;Joker|2;Dune|2;Wicked|2;Inside Out|2;Wall-E|2;Twilight|2;Cast Away|2;Parasite|3;Pulp Fiction|3;Fight Club|3;The Shawshank Redemption|3;Casablanca|3;Psycho|3;Mad Max Fury Road|3;Catch Me If You Can|3;The Wolf of Wall Street|3;Gravity|3;The Truman Show|3;Edward Scissorhands|3;Oceans Eleven|3;The Social Network|3`,
  kn: `KGF|1;Kantara|1;Charlie 777|1;Mungaru Male|1;Kirik Party|2;Googly|2;Rajakumara|2;Mr and Mrs Ramachari|2;Ugramm|2;Vikrant Rona|2;Gaalipata|2;Om|2;Jogi|2;Jackie|2;Viraat|2;Pailwaan|2;Yajamana|2;Mufti|2;Hebbuli|2;Love Mocktail|2;Kabzaa|2;Roberrt|2;Su From So|2;Kaatera|2;Bagheera|2;Garuda Gamana Vrishabha Vahana|3;Duniya|3;Sapta Sagaradaache Ello|3;Ulidavaru Kandanthe|3;Lucia|3;Bell Bottom|3;Bangarada Manushya|3;Kavaludaari|3;Rangitaranga|3;Godhi Banna Sadharana Mykattu|3;Natasaarvabhowma|3;Dia|3;Veera Kambala|3`,
};

const MOVIES = [];
Object.keys(RAW).forEach(l => RAW[l].split(';').forEach(s => {
  const [t, d] = s.trim().split('|');
  if (t) MOVIES.push({ t, l, d: +d, id: l + ':' + t });
}));

// ---------- Team quiz ----------
const QUIZ = [
  { id: 'langs', q: 'Which movie industries can you follow without subtitles?', multi: true, type: 'langs',
    opts: [['hi', '🎬 Hindi / Bollywood'], ['ta', '🎭 Tamil'], ['en', '🍿 English / Hollywood'], ['kn', '🌟 Kannada']] },
  { id: 'mem', q: 'Your movie memory is…', type: 'score',
    opts: [['I forget the hero\'s name mid-movie 🙈', 0], ['Casual watcher 🍿', 1], ['Proper movie fan 🎥', 2], ['Walking IMDb 🧠', 3]] },
  { id: 'act', q: 'Acting without speaking?', type: 'score',
    opts: [['Human statue 🗿', 0], ['I can manage 🙂', 1], ['Dramatic uncle/aunty energy 🎭', 2], ['Oscar-level overacting 🏆', 3]] },
  { id: 'sweet', q: 'Your Diwali sweet?', type: 'fun',
    opts: [['Kaju Katli', 1], ['Gulab Jamun', 2], ['Laddoo', 0], ['Jalebi', 3], ['Mysore Pak', 2], ['Chakli / Murukku (savoury only!)', 1]] },
  { id: 'cracker', q: 'Your cracker personality?', type: 'fun',
    opts: [['Sparklers ✨ (safe & pretty)', 0], ['Flower pots 🌸', 1], ['Rockets 🚀', 2], ['Atom bomb 💣 (I light it and run)', 3]] },
  { id: 'night', q: 'On Diwali night you are…', type: 'fun',
    opts: [['The cook 🍛', 1], ['The decorator 🪔', 0], ['The teen patti shark 🃏', 3], ['The one asleep on the sofa 😴', 2]] },
];

function pts(bid) { return Math.max(10, 130 - bid); }

// Quiz code helpers (player -> game master, via WhatsApp / copy paste)
function encodeCode(obj) {
  const j = JSON.stringify(obj);
  return 'BC1-' + btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeCode(code) {
  const m = /BC1-([A-Za-z0-9_-]+)/.exec(code);
  if (!m) return null;
  try {
    let b = m[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const o = JSON.parse(decodeURIComponent(escape(atob(b))));
    return o && o.n ? o : null;
  } catch (e) { return null; }
}
// Skill score used for balancing teams
function playerScore(o) {
  return (o.l ? o.l.length : 0) + (o.m || 0) * 2 + (o.a || 0) * 1.5 + (o.f || 0) * 0.15;
}
