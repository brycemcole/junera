'use client'

import { useState, useRef, useEffect } from 'react'

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'our-mission', title: 'Our Mission' },
  { id: 'our-values', title: 'Our Values' },
]

export default function About() {
  const [activeSection, setActiveSection] = useState('')
  const sectionRefs = useRef({})

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0,
    }

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (sectionId) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black shadow-md p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">About Us</h1>
        <nav className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`px-3 py-2 rounded transition-colors ${
                activeSection === section.id
                  ? 'bg-gray-300 bg-opacity-20 text-white'
                  : 'hover:bg-gray-300 hover:bg-opacity-20 hover:text-white'
              }`}
            >
              {section.title}
            </button>
          ))}
          <button
            onClick={() => scrollToSection('contact-us')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </button>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => (sectionRefs.current[section.id] = el)}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            {section.id === 'introduction' && (
              <p className="text-gray-300">
                Welcome to Junera! We strive to give you the advatage in STEM job searching by incorporating the necessary tools needed in todays job market and through providing a feedback-centrick platform where you can rate comapanies *something along the lines of being able to report if a company ghosted you and if job posting is down etc*
              </p>
            )}
            {section.id === 'our-mission' && (
              <p className="text-gray-300">
                Our mission is to ......
              </p>
            )}
            {section.id === 'our-values' && (
              <ul className="list-disc list-inside text-gray-300">
                <li>....</li>
              </ul>
            )}
          </section>
        ))}
        <section
          id="contact-us"
          ref={(el) => (sectionRefs.current['contact-us'] = el)}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <div className="text-gray-700 dark:text-gray-300">
            <p>If you have any feedback or would like to get in touch, please use the channels below:</p>
            <ul className="mt-2">
              <li>Email: <a href="mailto:support@junera.us" className="text-blue-600 dark:text-blue-400 hover:underline">support@junera.us</a></li>
              <li>Developer Emails: <a href="mailto:bryce@junera.us" className="text-blue-600 dark:text-blue-400 hover:underline">bryce@junera.us</a> & <a href="mailto:carlos@junera.us" className="text-blue-600 dark:text-blue-400 hover:underline">carlos@junera.us</a></li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}