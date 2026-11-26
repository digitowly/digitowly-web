/** Hand-drawn pixel sprites. See PixelArt.astro for how they're rendered. */

/**
 * The digitowly owl in flight, delivering the mail: a letter in its beak and
 * another in its claws. Two frames, wings up and wings down, same size.
 * On the downstroke the light front wing sweeps down in front of the body
 * and covers the dark back wing.
 */
export const mailOwlUp = [
  ".....GGGGGGGGG...............................",
  "GGGGGGGGGGGGGGGGGG...........................",
  "..GGGGGGGGGGGGGGGGG........ggggggg...........",
  "....GGGGGGGGGGGGGGGG........ggggggggggggg....",
  "......GGGGGGGGGGGGGGG........gggggggggggg....",
  ".........GGGGGGGGGGGGG.......ggggggggggg.....",
  ".........GGGGGGGGGGGGGG.....gggggggggggg.....",
  "........GGGGGGGGGGGGGGGG...gggggggggggg......",
  ".......GGGGGGGGGGGGGGGGGG...ggggggggggg......",
  "........GGGGGGGGGGGGGGGGG...gggggggggg.......",
  "...........GGGGGGGGGGGGGGG...ggggggggg.......",
  ".............GGGGGGGGGGGGkkkkkkkkkkkkkkkkkkkk",
  "..............GGGGGGGGGGGGGkkkkkkkkkkkkkkkkk.",
  ".............GGGGGGGGGGGGGGGkkkkkkkkkkkkkkk..",
  ".............GGGGGGGGGGGGGGgwwwkkkkkkkkwww...",
  "................GGGGGGGGGGggwkkwwkkkkwwkkw...",
  "....................GGGGGgggkkkkwwkkwwkkkk...",
  ".....................gggggggkhkkwwwwwwkhkk...",
  "....................ggggggggkkkkwwkkwwkkkk...",
  "...................gggggggggwkkwwwwkwwwkkw...",
  "..................ggggggggggwwwwwoooooooooo..",
  "................k.gggggggwwwwwwwwooyyyyyyoo..",
  "............kkkkkkggggggwwwwwwwwwoyooyyooyo..",
  "...........kkkkkkkgggggwwwwwwwwwwoyyyooyyyo..",
  "..............kkkkggggwwwwwwwwwwwoooooooooo..",
  ".................kkg..wwwwwwwwwwwwwwwwww.....",
  ".......................wkkwwwwwwwwwwwww......",
  "........................kkkwwwwwwwww.........",
  "........................kkk..................",
  "........................kk...................",
  ".......................Mnn...................",
  "....................MMMMnmm..................",
  "..................MMMMMnnmm..................",
  ".................nnnnMMnmmmm.................",
  ".................mmmmnnmmmm..................",
  "..................mmmmmmm....................",
  "..................mmmmm......................",
  "...................mm........................",
];

export const mailOwlDown = [
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".............................................",
  ".........................kkkkkkkkkkkkkkkkkkkk",
  "...........................kkkkkkkkkkkkkkkkk.",
  "............................kkkkkkkkkkkkkkk..",
  "...........................gwwwkkkkkkkkwww...",
  "..........................ggwkkwwkkkkwwkkw...",
  "........................ggggkkkkwwkkwwkkkk...",
  "....................ggggggggkhkkwwwwwwkhkk...",
  "..............ggggggggggggggkkkkwwkkwwkkkk...",
  ".............gggggggggggggggwkkwwwwkwwwkkw...",
  "..............ggggggggggggggwwwwwoooooooooo..",
  ".............ggggggggggggggwwwwwwooyyyyyyoo..",
  "..........ggggggggggggggggwwwwwwwoyooyyooyo..",
  ".......ggggggggggggggggggwwwwwwwwoyyyooyyyo..",
  "........ggggggggggggggggwwwwwwwwwoooooooooo..",
  ".........ggggggggggggggwwwwwwwwwwwwwwwww.....",
  "........gggggggggggggg.wkkwwwwwwwwwwwww......",
  ".....gggggggggggggggg...kkkwwwwwwwww.........",
  "..ggggggggggggggggg.....kkk..................",
  "gggggggggggggggggg......kk...................",
  "........gggg...........Mnn...................",
  "....................MMMMnmm..................",
  "..................MMMMMnnmm..................",
  ".................nnnnMMnmmmm.................",
  ".................mmmmnnmmmm..................",
  "..................mmmmmmm....................",
  "..................mmmmm......................",
  "...................mm........................",
];

export const mailOwlPalette = {
  G: "#27b85a",
  g: "#37dd6e",
  k: "#1f2233",
  w: "#ffffff",
  h: "#ffffff",
  y: "#fde89c",
  o: "#d9b04f",
  m: "#e6e6e6",
  M: "#f7f7f7",
  n: "#b9bcc4",
};

export const mushrooms = [
  "..rrr...........",
  ".rrcrr..........",
  "rcrrrcr.....RR..",
  "rrrrrrr....RcRR.",
  "..sss.....RRRRR.",
  "..sss.......s...",
  ".gssg.g...gsg.g.",
  "ggggggggggggggg.",
];

export const mushroomPalette = {
  r: "#c95a2e",
  R: "#e8843a",
  c: "#f3efe6",
  s: "#f2dca0",
  g: "#2c4639",
};

export const fern = [
  "......g......",
  "..g...g...g..",
  "...g..g..g...",
  "g...g.g.g...g",
  ".g...ggg...g.",
  "..gg.ggg.gg..",
  "....ggggg....",
  "......g......",
];

export const leaf = [
  "...lll",
  "..llLl",
  ".llLll",
  "llLll.",
  "lLll..",
  "L.....",
];
