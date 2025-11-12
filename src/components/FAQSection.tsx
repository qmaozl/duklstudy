import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is DUKL Pro?',
    answer: 'DUKL Pro is a premium subscription that unlocks all features including unlimited study sessions, AI-powered study materials, collaborative study rooms, ad-free experience, and priority support. It\'s designed to help serious students maximize their learning potential.',
  },
  {
    question: 'How does the payment work?',
    answer: 'DUKL Pro uses a one-time payment model. You pay HK$39 for 30 days of access. After the period ends, you can choose to purchase another 30 days whenever you need. We accept Card and Alipay payments.',
  },
  {
    question: 'Can I use DUKL without an account?',
    answer: 'Yes! You can browse the dashboard, view study groups, and explore the playlist maker without creating an account. However, to actually use features like creating playlists, joining study rooms, or generating flashcards, you\'ll need to sign up for free.',
  },
  {
    question: 'What makes DUKL different from other study apps?',
    answer: 'DUKL combines multiple essential study tools in one place: collaborative study rooms with real-time chat, an integrated YouTube playlist maker so you never leave your workflow, AI-powered flashcard generation, and intelligent study schedules. It\'s designed specifically for students who want to "lock in" and stay focused.',
  },
  {
    question: 'Does the playlist maker work on mobile?',
    answer: 'Yes! The playlist maker supports background audio playback on both iOS Safari and mobile browsers. You can play your study music and continue listening even when you exit the browser or switch apps.',
  },
  {
    question: 'How do study rooms work?',
    answer: 'Study rooms let you join virtual spaces with friends where you can track your study time together, chat, and stay accountable. It\'s like studying at the library with friends, but online. You can see who\'s actively studying and motivate each other to stay focused.',
  },
  {
    question: 'What AI features are included?',
    answer: 'DUKL Pro includes AI-powered flashcard generation from your notes, intelligent study schedule planning, video/document summarization, custom quiz generation, and an AI tutor that helps explain complex concepts. All designed to save you time and enhance learning.',
  },
  {
    question: 'Can I cancel or get a refund?',
    answer: 'Since DUKL Pro uses a one-time 30-day payment model, there are no recurring charges to cancel. If you\'re not satisfied within the first 7 days, contact our support team for a full refund.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption for all data transmission and storage. Your study materials, notes, and personal information are securely stored and never shared with third parties. You can export your data anytime.',
  },
  {
    question: 'Do you offer student discounts?',
    answer: 'The current pricing of HK$39/30 days is already student-friendly! We occasionally run special promotions, so follow us on social media or subscribe to our newsletter to stay updated.',
  },
];

export const FAQSection = () => {
  return (
    <section className="py-24 px-6 bg-saas-gray-lighter" data-fade-up>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal mb-6 font-swiss">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-saas-gray font-light font-swiss">
            Everything you need to know about DUKL Pro
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white border border-saas-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold text-saas-charcoal hover:text-saas-blue hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-saas-gray leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
