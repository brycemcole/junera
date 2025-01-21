'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Github, Linkedin, Mail, MessageSquare, Phone, Twitter } from 'lucide-react'

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
  // Dependencies: pnpm install lucide-react

  return (
    <div className="container py-20 px-4 mx-auto max-w-4xl md:px-0 w-full">
      <main className="space-y-4 items-center">
        {/* Hero Section */}
        <section className="text-center space-y-4 mb-20">
          <h1 className="text-3xl text-center dark:text-neutral-200 font-[family-name:var(--font-geist-mono)]">
            about
          </h1>
          <p className="text-center w-full mx-auto sm:max-w-sm dark:text-neutral-300 md:text-lg">
            Welcome to junera, a smarter job board for STEM professionals. Priotizing quality & speed on your job search.
          </p>
        </section>


        <section className="justify-center md:max-w-[750px] mx-auto space-y-14">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl text-center dark:text-neutral-200 font-[family-name:var(--font-geist-mono)]">Speed</h3>
              <p className="text-center w-full mx-auto sm:max-w-sm dark:text-neutral-300 md:text-lg py-4">
                We aim to bring you jobs as quick as possible with a job board that is updated daily with STEM jobs from accross the web.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl text-center dark:text-neutral-200 font-[family-name:var(--font-geist-mono)]">Quality</h3>
              <p className="text-center w-full mx-auto sm:max-w-sm dark:text-neutral-300 md:text-lg py-4">
                Our parameters ensure you get information right from the companies official website, prioritizing real, quality jobs.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto border-t border-neutral-10 lg:max-w-[900px] md:max-w-[750px] py-4" />

        {/* Contact Section */}
        <Card className="lg:max-w-[900px] md:max-w-[750px] mx-auto">
          <CardContent className="flex p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl dark:text-neutral-200 font-[family-name:var(--font-geist-mono)]">contact</h3>
                <p className="w-full mx-auto dark:text-neutral-300 md:text-md">
                  Feel free to reach out with any feedback or suggestions
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none w-full mx-auto dark:text-neutral-300">Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <a href="bryce@junera.us">bryce@junera.us</a>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <a href="cy@junera.us">cy@junera.us</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Github className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none w-full mx-auto dark:text-neutral-300">Github</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href="https://github.com/brycemcole/junera">https://github.com/brycemcole/junera</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
