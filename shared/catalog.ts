export type WigTexture = "Bob" | "Straight" | "Body wave" | "Curly" | "Afro kinky";
export type WigGrade = "12A" | "14A";
export type WigColor = "Black" | "Highlight";
export type WigLace = "5X5" | "13X4";

export type WigProduct = {
  id: string;
  slug: string;
  name: string;
  grade: WigGrade;
  price: number;
  length: number;
  texture: WigTexture;
  lace: WigLace;
  color: WigColor;
  density?: number;
  glueless?: true;
  image: string;
};

/** Only the ten supplier-provided products; each has a unique illustrative AI model image. */
export const wigProducts: WigProduct[] = [
  {
    id: "12a-bob-10-black",
    slug: "12a-5x5-10-bob-black",
    name: '12A 5X5 10" bob black',
    grade: "12A",
    price: 1199.99,
    length: 10,
    texture: "Bob",
    lace: "5X5",
    color: "Black",
    image: "/manus-storage/async-images/VXPiMeL5n9elYy7LNZPaJy/image-1.webp",
  },
  {
    id: "12a-bob-10-highlight",
    slug: "12a-5x5-10-bob-highlight",
    name: '12A 5X5 10" bob highlight',
    grade: "12A",
    price: 1349.99,
    length: 10,
    texture: "Bob",
    lace: "5X5",
    color: "Highlight",
    image: "/manus-storage/async-images/VXPiMeL5n9elYy7LNZPaJy/image-2.webp",
  },
  {
    id: "12a-straight-18-black-glueless",
    slug: "12a-180-13x4-18-straight-black-glueless",
    name: '12A 180% 13X4 18" straight black glueless',
    grade: "12A",
    price: 1799.99,
    length: 18,
    texture: "Straight",
    lace: "13X4",
    color: "Black",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/VXPiMeL5n9elYy7LNZPaJy/image-3.webp",
  },
  {
    id: "12a-straight-20-black-glueless",
    slug: "12a-180-13x4-20-straight-black-glueless",
    name: '12A 180% 13X4 20" straight black glueless',
    grade: "12A",
    price: 1999.99,
    length: 20,
    texture: "Straight",
    lace: "13X4",
    color: "Black",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/VXPiMeL5n9elYy7LNZPaJy/image-4.webp",
  },
  {
    id: "12a-body-20-black-glueless",
    slug: "12a-180-13x4-20-body-black-glueless",
    name: '12A 180% 13X4 20" body black glueless',
    grade: "12A",
    price: 2099.99,
    length: 20,
    texture: "Body wave",
    lace: "13X4",
    color: "Black",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/VXPiMeL5n9elYy7LNZPaJy/image-5.webp",
  },
  {
    id: "12a-body-20-highlight-glueless",
    slug: "12a-180-13x4-20-body-highlight-glueless",
    name: '12A 180% 13X4 20" body highlight glueless',
    grade: "12A",
    price: 2299.99,
    length: 20,
    texture: "Body wave",
    lace: "13X4",
    color: "Highlight",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/siZjtocAHMNjCLpO6uJY9j/image-1.webp",
  },
  {
    id: "12a-curly-20-black-glueless",
    slug: "12a-180-13x4-20-curly-black-glueless",
    name: '12A 180% 13X4 20" curly black glueless',
    grade: "12A",
    price: 2199.99,
    length: 20,
    texture: "Curly",
    lace: "13X4",
    color: "Black",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/siZjtocAHMNjCLpO6uJY9j/image-2.webp",
  },
  {
    id: "12a-afro-kinky-18-black-glueless",
    slug: "12a-180-13x4-18-afro-kinky-black-glueless",
    name: '12A 180% 13X4 18" Afro kinky black glueless',
    grade: "12A",
    price: 1999.99,
    length: 18,
    texture: "Afro kinky",
    lace: "13X4",
    color: "Black",
    density: 180,
    glueless: true,
    image: "/manus-storage/async-images/siZjtocAHMNjCLpO6uJY9j/image-3.webp",
  },
  {
    id: "14a-straight-20-black-glueless",
    slug: "14a-13x4-20-straight-black-glueless",
    name: '14A 13X4 20" straight black glueless',
    grade: "14A",
    price: 2999.99,
    length: 20,
    texture: "Straight",
    lace: "13X4",
    color: "Black",
    glueless: true,
    image: "/manus-storage/async-images/siZjtocAHMNjCLpO6uJY9j/image-4.webp",
  },
  {
    id: "14a-body-20-black-glueless",
    slug: "14a-13x4-20-body-black-glueless",
    name: '14A 13X4 20" body black glueless',
    grade: "14A",
    price: 3199.99,
    length: 20,
    texture: "Body wave",
    lace: "13X4",
    color: "Black",
    glueless: true,
    image: "/manus-storage/async-images/siZjtocAHMNjCLpO6uJY9j/image-5.webp",
  },
];

export const getWig = (slug: string) => wigProducts.find((product) => product.slug === slug);
