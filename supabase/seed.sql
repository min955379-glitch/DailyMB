
-- Sources verified live on 2026-10-14 via web search (each was publishing a dated
-- "today" page that day). Add/remove here or directly in the table - no redeploy needed.
insert into public.sources (name, url, parser, priority) values
  ('apna4g',             'https://apna4g.com/telenor-quiz/',                                            'answer-is-option',     10),
  ('telenortodayquiz',   'https://telenortodayquiz.com/',                                               'correct-answer-label', 20),
  ('todaymytelenoranswer','https://todaymytelenoranswer.pk/',                                           'question-answer-block',30),
  ('telenorquiztoday-io','https://telenorquiztoday.io/telenor-quiz-today-2026-updated-questions-answers/','generic',            40),
  ('mytelenorquiz',      'https://mytelenorquiz.pk/',                                                   'generic',              50),
  ('theiq',              'https://theiq.pk/telenor-daily-quiz-answers-today/',                          'generic',              60),
  ('telenorquiztodays',  'https://telenorquiztodays.pk/',                                               'generic',              70),
  ('telenorequiztoday',  'https://telenorequiztoday.pk/',                                               'question-answer-block',80),
  ('todaytelenoranswers','https://todaytelenoranswers.pk/',                                             'generic',              90)
on conflict (name) do update set url = excluded.url, parser = excluded.parser, priority = excluded.priority;
