'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
const sections = [
  { id: 'introduction', title: 'Introduction' },
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
    <div className="min-h-screen text-primary">
      <main className="max-w-4xl mx-auto p-6 text-md">
        <h1 className="text-3xl dark:text-neutral-200 font-mono mb-8">About Junera</h1>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => (sectionRefs.current[section.id] = el)}
            className="mb-12"
          >
            <h2 className="text-lg font-medium mb-4">{section.title}</h2>
            {section.id === 'introduction' && (
              <p className="text-muted-foreground dark:text-neutral-300">
                Welcome to junera, a smarter job board for STEM professionals.
              </p>
            )}
            {section.id === 'our-mission' && (
              <p className="text-primary">
                Our mission is to ......
              </p>
            )}
            {section.id === 'our-values' && (
              <ul className="list-disc list-inside">
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
          <h2 className="text-lg font-medium mb-4">Contact Us</h2>
          <div className="text-muted-foreground dark:text-neutral-300">
            <p>If you have any feedback or would like to get in touch, please use the channels below:</p>
            <ul className="mt-2">
              <li>Email: <Link href="mailto:support@junera.us"><Button variant="link" className="p-0">support@junera.us</Button></Link></li>
              <li>Developer Emails: <Link href="mailto:bryce@junera.us"><Button variant="link" className="p-0">bryce@junera.us</Button></Link> & <Link href="mailto:carlos@junera.us"><Button variant="link" className="p-0">carlos@junera.us</Button></Link></li>
            </ul>
          </div>
        </section>
      </main>
    </div >
  )
}