// Shaped to mirror a future News API model so wiring a real backend later
// is a drop-in replacement for the static data in data/newsData.ts.
export default interface newsModel {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;      // ISO string
  imageUrl: string;
}
