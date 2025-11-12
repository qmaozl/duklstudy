import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, School, GraduationCap, Library, BookOpen } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Medicine Student, HKU',
    avatar: 'SC',
    content: 'DUKL completely transformed my study routine. The study rooms keep me accountable, and the AI flashcards helped me ace my anatomy exam. Worth every dollar!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus Wong',
    role: 'Engineering Student, HKUST',
    avatar: 'MW',
    content: 'The playlist maker is a game-changer. I can finally focus without switching tabs every 5 minutes. My productivity has doubled since I started using DUKL.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Emily Tan',
    role: 'Business Student, CUHK',
    avatar: 'ET',
    content: 'I was skeptical at first, but the study group feature made studying fun again. My grades improved from B to A in just one semester. Highly recommend!',
    rating: 5,
  },
  {
    id: '4',
    name: 'Jason Lee',
    role: 'Law Student, CityU',
    avatar: 'JL',
    content: 'The AI-powered summaries saved me hours of reading time. DUKL Pro is the best investment I\'ve made for my academic success.',
    rating: 5,
  },
  {
    id: '5',
    name: 'Rachel Kim',
    role: 'Computer Science, PolyU',
    avatar: 'RK',
    content: 'Clean interface, powerful features. The timer and focus modes help me stay locked in during coding sessions. Can\'t imagine studying without it now.',
    rating: 5,
  },
  {
    id: '6',
    name: 'David Zhang',
    role: 'Finance Student, HKU',
    avatar: 'DZ',
    content: 'DUKL helped me stay organized during exam season. The study schedule planner and collaborative rooms made group projects so much easier.',
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  const schoolIcons = [School, GraduationCap, Library, BookOpen];

  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden">
      {/* Animated School Icons Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {schoolIcons.map((Icon, idx) => (
          <Icon
            key={idx}
            className="absolute text-saas-blue/10 animate-float"
            size={80}
            style={{
              left: `${15 + idx * 25}%`,
              top: `${20 + (idx % 2) * 40}%`,
              animationDelay: `${idx * 0.5}s`,
              animationDuration: `${4 + idx}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* New Header Text */}
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-saas-blue uppercase tracking-wide">
            Trusted by students from all around the world
          </p>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal mb-6 font-swiss">
            Loved by Students Worldwide
          </h2>
          <p className="text-xl text-saas-gray font-light font-swiss max-w-2xl mx-auto">
            Join thousands of students who transformed their study habits with DUKL
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              data-fade-up
              className="bg-white border border-saas-border rounded-2xl p-6 hover-lift opacity-0 translate-y-8 transition-all duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-saas-blue-dark to-saas-blue">
                  <AvatarFallback className="text-white font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-saas-charcoal">{testimonial.name}</h4>
                  <p className="text-sm text-saas-gray-medium">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-saas-blue text-saas-blue" />
                ))}
              </div>

              <p className="text-saas-gray leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
