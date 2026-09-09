import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Sparkles, TrendingUp, ArrowRight, Play } from 'lucide-react';
import type { Movie } from '@/types';
import { supabase } from '@/lib/supabase';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeGenre, setActiveGenre] = useState<string>('All');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('rating', { ascending: false });
      if (!error && data) setMovies(data as Movie[]);
      setLoading(false);
    })();
  }, []);

  const allGenres = ['All', ...Array.from(new Set(movies.flatMap((m) => m.genres ?? [])))];
  const filteredMovies = activeGenre === 'All' ? movies : movies.filter((m) => m.genres?.includes(activeGenre));
  const featured = movies.slice(0, 5);
  const trending = [...movies].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 10);
  const topRated = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      {featured.length > 0 && (
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={featured[0].backdrop_url || featured[0].poster_url || ''}
              alt={featured[0].title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>

          <div className="relative h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-5 pt-16">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-black">
                  #1 Telugu Movie
                </span>
                <span className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {featured[0].rating.toFixed(1)}
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
                {featured[0].title}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed line-clamp-3">
                {featured[0].synopsis}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMovie(featured[0])}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all"
                >
                  <Play className="w-5 h-5 fill-black" />
                  View Details
                </button>
                <Link
                  to="/recommendations"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Recommendations
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genre Filter Bar */}
      <div className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeGenre === genre
                    ? 'bg-amber-400 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* All Movies Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              {activeGenre === 'All' ? 'All Telugu Movies' : `${activeGenre} Movies`}
            </h2>
            <span className="text-sm text-gray-500">{filteredMovies.length} movies</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={setSelectedMovie} />
              ))}
            </div>
          )}
        </section>

        {/* Trending Now */}
        {activeGenre === 'All' && trending.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              Latest Releases
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={setSelectedMovie} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-400/20 via-orange-600/10 to-transparent border border-amber-400/20 p-8 sm:p-12">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Discover Your Next
              <br />
              <span className="text-amber-400">Favorite Telugu Film</span>
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Rate a few movies and let our smart recommendation engine find Telugu movies you'll love.
            </p>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 text-black font-bold hover:from-amber-300 hover:to-orange-500 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Personalized Recommendations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
