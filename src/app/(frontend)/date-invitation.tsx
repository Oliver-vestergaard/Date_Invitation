'use client'

import { useMemo, useState } from 'react'

const activities = [
  'Dinner Date',
  'Movie Night',
  'Walk with Coffee',
  'Beer / Wine',
  'Surprise',
  'Museum',
  'Minigolf',
  'PARTY!',
] as const

type Step = 'invite' | 'activity' | 'schedule' | 'review'
type Response = 'Yes' | 'No' | null

function Progress({ step }: { step: Step }) {
  const active = ['invite', 'activity', 'schedule', 'review'].indexOf(step)

  return (
    <div className="progress" aria-label={`Step ${active + 1} of 4`}>
      {[0, 1, 2, 3].map((index) => (
        <span
          className={index <= active ? 'progress-dot progress-dot-active' : 'progress-dot'}
          key={index}
        />
      ))}
    </div>
  )
}

export function DateInvitation() {
  const [step, setStep] = useState<Step>('invite')
  const [response, setResponse] = useState<Response>(null)
  const [activity, setActivity] = useState<(typeof activities)[number] | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 })

  const minimumDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const chooseResponse = (answer: Exclude<Response, null>) => {
    setResponse(answer)
    setPreviewMessage('')
    setStep(answer === 'Yes' ? 'activity' : 'review')
  }

  const chooseActivity = (choice: (typeof activities)[number]) => {
    setActivity(choice)
    window.setTimeout(() => setStep('schedule'), 170)
  }

  const dodgeNoButton = () => {
    const horizontalRange = window.innerWidth < 520 ? 58 : 150
    const verticalRange = window.innerWidth < 520 ? 92 : 78

    setNoPosition((current) => {
      let next = current

      while (Math.hypot(next.x - current.x, next.y - current.y) < 72) {
        next = {
          x: Math.round((Math.random() * 2 - 1) * horizontalRange),
          y: Math.round((Math.random() * 2 - 1) * verticalRange),
        }
      }

      return next
    })
  }

  const restart = () => {
    setStep('invite')
    setResponse(null)
    setActivity(null)
    setDate('')
    setTime('')
    setPreviewMessage('')
  }

  return (
    <main className="invitation-shell">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />

      <div className="runner" aria-hidden="true">
        <img src="/assets/d15ae.png" alt="" />
      </div>

      <div className="jumper-wrap" aria-hidden="true">
        <div className="jumper">
          <img src="/assets/e5fd9.png" alt="" />
        </div>
        <img className="jumper-shadow" src="/assets/8551d.svg" alt="" />
      </div>

      <section className="invitation-card" aria-live="polite">
        <Progress step={step} />

        <div className="step-panel" key={step}>
          {step === 'invite' && (
            <div className="invite-step">
              <p className="eyebrow">A SMALL QUESTION</p>
              <h1>WOULD YOU LIKE TO GO ON A DATE WITH ME?</h1>
              <div className="button-row invite-actions">
                <button
                  className="choice-button choice-button-large"
                  onClick={() => chooseResponse('Yes')}
                >
                  YES
                </button>
                <button
                  aria-label="No — this button runs away"
                  className="choice-button choice-button-small runaway-button"
                  onClick={(event) => {
                    event.preventDefault()
                    dodgeNoButton()
                  }}
                  onFocus={dodgeNoButton}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    dodgeNoButton()
                  }}
                  onPointerEnter={dodgeNoButton}
                  style={{ transform: `translate3d(${noPosition.x}px, ${noPosition.y}px, 0)` }}
                  type="button"
                >
                  NO
                </button>
              </div>
            </div>
          )}

          {step === 'activity' && (
            <div className="activity-step">
              <p className="eyebrow">PICK YOUR FAVORITE</p>
              <h2>What would you like to do?</h2>
              <div className="activity-grid">
                {activities.map((choice) => (
                  <button
                    className={activity === choice ? 'choice-button is-selected' : 'choice-button'}
                    key={choice}
                    onClick={() => chooseActivity(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <button className="text-button" onClick={() => setStep('invite')}>
                Back
              </button>
            </div>
          )}

          {step === 'schedule' && (
            <form
              className="schedule-step"
              onSubmit={(event) => {
                event.preventDefault()
                setStep('review')
              }}
            >
              <p className="eyebrow">ONE LAST THING</p>
              <h2>WHEN WOULD YOU LIKE TO GO?</h2>
              <label className="date-field">
                <span>DATE</span>
                <input
                  required
                  min={minimumDate}
                  type="date"
                  value={date}
                  onChange={(event) => {
                    event.currentTarget.setCustomValidity('')
                    setDate(event.target.value)
                  }}
                  onInvalid={(event) => {
                    if (event.currentTarget.validity.valueMissing) {
                      event.currentTarget.setCustomValidity(
                        'You forgot to pick our date! ❤️',
                      )
                    }
                  }}
                />
              </label>
              <label className="date-field">
                <span>TIME</span>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(event) => {
                    event.currentTarget.setCustomValidity('')
                    setTime(event.target.value)
                  }}
                  onInvalid={(event) => {
                    if (event.currentTarget.validity.valueMissing) {
                      event.currentTarget.setCustomValidity('And what time should I be ready? ❤️')
                    }
                  }}
                />
              </label>
              <div className="button-row schedule-actions">
                <button className="text-button" type="button" onClick={() => setStep('activity')}>
                  Back
                </button>
                <button className="choice-button continue-button" type="submit">
                  CONTINUE
                </button>
              </div>
            </form>
          )}

          {step === 'review' && (
            <div className="review-step">
              <p className="eyebrow">READY TO SEND</p>
              <h2>{response === 'No' ? 'NO WORRIES AT ALL' : 'OUR DATE PLAN'}</h2>

              <dl className="review-list">
                <div>
                  <dt>Answer</dt>
                  <dd>{response}</dd>
                </div>
                {response === 'Yes' && (
                  <>
                    <div>
                      <dt>Plan</dt>
                      <dd>{activity}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>
                        {date ? new Date(`${date}T12:00:00`).toLocaleDateString() : 'Not selected'}
                      </dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{time || 'Not selected'}</dd>
                    </div>
                  </>
                )}
              </dl>

              <button
                className="choice-button submit-button"
                onClick={() =>
                  setPreviewMessage(
                    'The design is ready. Email delivery will be connected after your approval.',
                  )
                }
              >
                SUBMIT
              </button>
              {previewMessage && <p className="preview-message">{previewMessage}</p>}
              <button className="text-button" onClick={restart}>
                Start over
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="footer-note">Made with courage and a little bit of hope.</p>
    </main>
  )
}
