**Key Takeaways, Sources, and Additional Reading at the bottom**

## What I Know Now About AI Impacts on Education

*So is AI hijacking our brains or making us geniuses? It depends...*

Consider a classroom where the teacher gets up, stands in front of the students, and says nothing. After a moment of waiting, a student asks a question, and the teacher gives the answer clearly and directly. Then the silence continues until the next question. The teacher does not invite students to do homework. They do not ask the student what they think first. They do not respond in a way we think a teacher should. 

Learning is one of the most common uses of AI. Most of that time, that learning is in the form of asking AI a question and receiving an answer. That can be a great use case of AI, and people like it. That is why general use AI has been trained to act in this way. However, that can't be the only way someone learns, or even the primary way.

Students using general use AI are involved in a swiss army knife conversation. It can do everything but your dishes, including revising papers, writing an email, answering questions, giving life advice, being an emotional support block, and making its maker money. It would be nice to take that multitool and pull out the tutor tool, the best one for learning - but finding that tool within the AI is very unclear, and as of today it is not used by many users.

To be clear, the teacher does live inside general use AI, hiding and waiting. By far, its greatest advantage is personalized learning. Students can use AI within traditional frameworks, generating multiple choice quizzes and flashcards and inviting the AI to grade their answers ([Kasneci 2023](https://doi.org/10.1016/j.lindif.2023.102274)). They can ask the AI to help them think in new ways by asking curiosity-invoking questions ([Abdelghani et al., 2022](https://www.sciencedirect.com/science/article/pii/S1041608023000195?ref=pdf_download&fr=RR-2&rr=944885ffbbcadf03#bb0005)). It can evaluate the student's work, giving immediate feedback in real time - a task a teacher could never perform for every student in the class all at once. It has seemingly infinite time and attention for the student. But the AI's infinite eagerness has its costs for students. 

Research has been coming out showing the effects of AI use on learning, and the research is growing. One common trend is for people to become aware that they are beginning to think less for themselves, and offloading their thought processes to AI. This process has been termed "cognitive offloading" and has not only been a general perception in the population of AI users, but has also been studied empirically as a real issue ([Gerlich 2025](https://doi.org/10.3390/soc15010006)). Not everyone is losing their mind to AI, but a growing number of people literally are.

One theme in the literature to mitigate this risk of cognitive offloading is for users to demonstrate a certain set AI core competencies - things that will place them in a safe zone. These competencies are not yet widely agreed upon, but they may include ([Kasneci 2023](https://doi.org/10.1016/j.lindif.2023.102274); [Zu 2025](https://doi.org/10.1016/j.csi.2025.104006)):
1. Understanding the limitations of AI - usually by conscious experimentation
2. Allow the AI to think with them instead of in place of them
3. Use critical thinking and problem-solving skills to assess the AI
4. Verify AI's correctness with other more reliable materials
5. Generate perspectives and hypotheses, not answers

Having a student that is competent in using AI is the greatest protection for a student. 

However important the individual's responsibility, I believe corporations and educators alike have the responsibility to make AI easier to learn with. How do we better pull out the tutor tool from the AI swiss army knife? There are certain things the user needs to do and know, but how do we customize AI to better support the learner, keeping use of the AI's advantages while discarding its disadvantages? That was the goal of the second part of my research.

### The Tutor Chat
In an attempt both to explore the creation agentic AI and to see if I could make a better tutor, I programmed my own AI based on Google's Gemini and conducted an experiment to test it. The AI I designed has textbook content it is able to pull from, and with every prompt, makes an assessment of the user's learning stage in the instructional hierarchy. The experiment itself used this AI as a treatment, and another standard AI with the simple prompt "Hi! I'm a helpful tutor chat for your Education Psychology and Human Development class. What can I help you with?"

The volunteer sample size was too small to make any generalizable or statistical conclusions. However, from viewing their conversations, seeing their survey responses, and collecting their open ended feedback, my AI was no better than the simple prompt of the control group. The biggest advantage it had was 1) it had textbook content and was for that class alone, and 2) it was slow to answer questions (meaning it asked the student what they thought or what they knew before answering questions). Some people were frustrated by the second advantage, but upon viewing their conversations, I see that largely as a win (in most cases). However, in my opinion, there was a general consensus that the single prompt "I'm a helpful tutor" was better for learning than the usual ask anything mode.

My AI creation was a learning experience, albeit hardly conclusive as to how to control AI use. I intent to continue trying and learning to control AI. In the meantime, I agree with some of the literature which invites students to better understand AI and develop those core competencies of critical thinking, knowing AI's limitations, and putting in the work to think on their own with the AI as their assistant.

### For coders: The technical side of creating the AI
The most interesting parts of making the AI, I think, were its use of a database for the textbook content, function calls with structured output, and guided thinking. With every user prompt, it would first ask if it needed to pull in textbook content for its response, then made an assessment of how it should respond based on the user's "learning stage" in the instructional hierarchy (which is an idea grounded in learning theory). 

I scraped the textbook content beforehand using [Firecrawl](firecrawl.dev). I had it generate a sitemap, then programmed in essence "for every url, scrape that content and put it as a database entry". I then looped through the content using Gemini to make of summary of the page and store the summary. When the function call was made to pull in textbook content, it was offered the page titles as enums it could respond with, and told in its description the content of each title in the form of 'title: summary \n title: summary'. This reduces the context needed to make a good decision and have relevant context for each response. 

The guided thinking was fairly simple. After pulling textbook content, it would receive a one-shot prompt with an example of how it could respond. I then had to concatenate to the end of the prompt "I will not comment on or mention this knowledge in my next response, but I will use it to inform how I respond." Otherwise, it would say things to the user that do not make sense. In essence, it gave a response to itself.

I found that this guided thinking, at least how I implemented it, was marginally helpful. The one-shot prompt I think invited it to respond with the same learning stage every time, which defeats its purpose. I also saw it ignore what it said it would do in the previous prompt to itself.

In some simpler cases, I found it to be extremely consistent, especially when using structured output like selecting textbook content given the same prompt. However, it is not consistent with my knowledge and reason.

Overall, I found that AI is hard to measure and difficult to wrangle. Even when I thought I could predict its behavior, it still acted in unexpected ways. I am still learning ways to make the AI more consistent with what I expect.


## Key Takeaways:
**For everyone:**
- If we are not careful, AI can hijack our learning by doing the hard cognitive work for us.
- Take time to think long and hard - getting quick answers is usually not the best way to learn.
- Let AI inform you along with other sources rather than taking it as your source of truth.
- There are simple prompts you can use that can greatly change AI's behavior, such as "You are a helpful tutor"

**For educators:**
- Help students find ways to learn that are consistent with established learning theory.
- Decide on a set of core AI competencies to teach students as they interact with your content.
- Help students be aware of the effect AI is having on their ability to learn and think for themselves.

**For programmers:**
- AI is hard to measure and difficult to wrangle. Even when I thought I could predict its behavior, it still acted in unexpected ways. 
- The actual API for Gemini is fairly simple to use, and the docs are usually sufficient to learn from. 
- There is an exponential input cost as conversations get longer, so finding ways to summarize, cap, or condense earlier conversation pieces is vital.
- Gemini has a generous free tier for experimentation and relatively low costs beyond that for individual or small use cases.


## Additional resources
### Literature on the effects of AI on learning:
- [Gerlich 2025 - AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking](https://doi.org/10.3390/soc15010006)
- [Kasneci 2023 - ChatGPT for good? On opportunities and challenges of large language models for education](https://doi.org/10.1016/j.lindif.2023.102274)
- [Xu 2025 - Standardization in artificial general intelligence model for education](https://doi.org/10.1016/j.csi.2025.104006)
- [Abdelghani et al., 2022 - GPT-3-Driven Pedagogical Agents to Train Children’s Curious Question-Asking Skills](https://doi.org/10.1007/s40593-023-00340-7)

### Agentic programming
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Gemini AI Studio](https://aistudio.google.com/)
- [AI Agentic Patters](https://www.philschmid.de/agentic-patterns)
- [Firecrawl](firecrawl.dev) (for getting the textbook content)
- [My Github Repo](https://github.com/jamesbeeson01/Chat-Interface)
