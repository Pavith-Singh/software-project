import Nav from './components/Nav/Nav'
import ThreeScene from './components/Nav/ThreeScene'
import { useState } from 'react'
import React, { useEffect } from 'react';

const carouselItems = [
  {
    title: "Welcome to Student World",
    content: "School can sometimes feel like navigating a blackhole. You can find yourself lost in an endless void of content. Student World helps students zoom out and see the light",
    leftText: "Explore the limitless subjects",
    rightText: "Learn at your pace"
  },
  {
    title: "Helping Students Succeed",
    content: "Student World is designed with both HSC and IB students in mind and aims to fix the school system by putting students first.",
    leftText: "Designed for students with adhd in mind",
    rightText: "AI to enhance your learning"
  },
  {
    title: "Join Our Community",
    content: "Connect with like minded students, choose your teachers, and share knowledge. We have a vision to make learning more collaborative and engaging.",
    leftText: "Connect with peers",
    rightText: "Share and grow"
  },
  {
    title: "Sign in to Student World",
    content: "Ready to start your journey? Sign in now to access personalized learning resources and join our community of learners.",
    leftText: "Get started today",
    rightText: "Begin your journey"
  }
];

const Home: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      const progress = scrollTop / maxScroll;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalWidth = carouselItems.length * window.innerWidth;
  const translateX = -scrollProgress * (totalWidth - window.innerWidth);

  return (
    <div className="relative">
      <Nav />
      <ThreeScene scrollProgress={scrollProgress} />
      
      <div 
        className="fixed bottom-0 left-0 w-full h-[50vh] overflow-hidden"
      >
        <div 
          className="flex h-full"
          style={{ 
            width: `${totalWidth}px`,
            transform: `translateX(${translateX}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {carouselItems.map((item, index) => (
            <div
              key={index}
              className="flex-none w-screen h-full flex items-center justify-center px-4"
            >
              <div className="flex w-full max-w-4xl items-center">
                <div className="w-1/4 pr-4">
                  <p className="text-white text-lg">{item.leftText}</p>
                </div>
                <div className="w-1/2">
                  <div 
                    className="bg-white/20 backdrop-blur-md rounded-lg shadow-xl p-8 transform transition-transform duration-500"
                    style={{
                      opacity: 1 - Math.abs(scrollProgress - index / (carouselItems.length - 1)),
                      transform: `scale(${1 - Math.abs(scrollProgress - index / (carouselItems.length - 1)) * 0.2})`
                    }}
                  >
                    <h2 className="text-4xl text-white font-bold mb-4">{item.title}</h2>
                    <p className="text-white text-lg mb-6">{item.content}</p>
                    {index === carouselItems.length - 1 && (
                      <a 
                        href="/signin" 
                        className="inline-block bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105"
                      >
                        Sign In
                      </a>
                    )}
                  </div>
                </div>
                <div className="w-1/4 pl-4">
                  <p className="text-white text-lg">{item.rightText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '300vh' }}></div> 
    </div>
  );
};

export default Home;