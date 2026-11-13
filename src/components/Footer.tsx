import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onGoHome: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoHome }) => {
  const handleScrollTo = (id: string) => {
    onGoHome();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 text-xs mt-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={() => {
                onGoHome();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="brand-wordmark text-xl font-extrabold text-zinc-950 flex items-center gap-1.5 cursor-pointer text-left"
            >
              One<span className="text-blue-600">Yesly</span>
            </button>
            <p className="text-zinc-500 leading-relaxed text-xs">
              Your ultimate destination for high-definition anime streaming with multi-language audio dubs (Hindi, English, Japanese) and lightning-fast ad-free playback.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-zinc-950 uppercase tracking-wider text-[11px]">
              Quick Links
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onGoHome();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Home Catalog
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('trending')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Trending Anime
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('hindi-dubbed')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Hindi Dubbed Releases
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('movies')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Popular Movies
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Genres */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-zinc-950 uppercase tracking-wider text-[11px]">
              Popular Genres
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['Action', 'Fantasy', 'Sci-Fi', 'Romance', 'Adventure', 'Shounen', 'Isekai', 'Drama', 'Mystery', 'Slice of Life'].map((genre) => {
                const targetId = genre.toLowerCase().includes('action') ? 'action'
                  : genre.toLowerCase().includes('fantasy') ? 'fantasy'
                  : genre.toLowerCase().includes('sci') ? 'scifi'
                  : 'trending';
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleScrollTo(targetId)}
                    className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium cursor-pointer"
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 text-xs">
          <p>© {new Date().getFullYear()} One Yesly. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-0.5" />
            <span>for anime fans worldwide.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
