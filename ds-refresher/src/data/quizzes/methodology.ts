import type { QuizQuestion } from './types'

export const methodologyQuiz: QuizQuestion[] = [
  {
    id: 'm1-q1',
    prompt: 'What is the FIRST stage of the IBM data science methodology?',
    options: ['Business Understanding', 'Data Collection', 'Analytic Approach', 'Data Requirements'],
    correctIndex: 0,
    explanation:
      'Every project starts with Business Understanding: pinning down what problem you are actually solving. Without it, every later stage optimizes the wrong thing.',
  },
  {
    id: 'm1-q2',
    prompt: 'In the methodology, what does the Analytic Approach stage decide?',
    options: [
      'What type of model the question calls for (descriptive, predictive, …)',
      'Which database the data will be stored in',
      'How model accuracy will be reported to stakeholders',
      'Which team members work on the project',
    ],
    correctIndex: 0,
    explanation:
      'Analytic Approach translates the business question into a modeling style: descriptive, diagnostic, predictive, or prescriptive — which then dictates the techniques.',
  },
  {
    id: 'm1-q3',
    prompt: '“Which customers will churn next quarter?” calls for which analytic approach?',
    options: ['Predictive', 'Descriptive', 'Diagnostic', 'Prescriptive'],
    correctIndex: 0,
    explanation:
      'Forecasting a future outcome per customer is predictive analytics — typically a classification model (churn / no churn).',
  },
  {
    id: 'm1-q4',
    prompt:
      'During Data Understanding you discover the data poorly represents the problem. Which stage do you typically loop back to?',
    options: ['Data Collection', 'Deployment', 'Evaluation', 'Modeling'],
    correctIndex: 0,
    explanation:
      'Data Understanding checks whether the collected data is representative; gaps send you back to Data Collection (or even Data Requirements) for more or better data.',
  },
  {
    id: 'm1-q5',
    prompt: 'Which stage commonly consumes the largest share of project time?',
    options: ['Data Preparation', 'Modeling', 'Deployment', 'Business Understanding'],
    correctIndex: 0,
    explanation:
      'Cleaning, transforming, and feature engineering — Data Preparation — is widely cited as 60–80% of a data science project’s effort.',
  },
  {
    id: 'm1-q6',
    prompt: 'A model fails its quality bar at Evaluation. According to the methodology, what happens next?',
    options: [
      'Loop back to Modeling (or revisit the Analytic Approach)',
      'Deploy it anyway and monitor closely',
      'Restart from Business Understanding',
      'Skip ahead to the Feedback stage',
    ],
    correctIndex: 0,
    explanation:
      'Evaluation is a gate: failures send you back to retune the model, and persistent failures may mean the chosen analytic approach itself was wrong.',
  },
  {
    id: 'm1-q7',
    prompt: 'What makes the methodology a “loop” rather than a straight pipeline?',
    options: [
      'The Feedback stage feeds real-world results back into Business Understanding',
      'Each stage is repeated exactly twice before moving on',
      'Data Collection runs continuously in parallel with all stages',
      'Deployment automatically retrains the model on a schedule',
    ],
    correctIndex: 0,
    explanation:
      'After Deployment, the Feedback stage measures real-world performance, which refines the problem definition itself — closing the loop back to stage 1.',
  },
  {
    id: 'm1-q8',
    prompt: '“Group our neighborhoods into natural segments” (no labels to predict) suggests which technique?',
    options: ['Clustering', 'Linear regression', 'Classification', 'Time-series forecasting'],
    correctIndex: 0,
    explanation:
      'With no target variable, this is a descriptive question — clustering (e.g., k-means) finds natural structure. Exactly what the 2019 Toronto capstone did.',
  },
  {
    id: 'm1-q9',
    prompt: 'Which question belongs to the Data Requirements stage?',
    options: [
      '“What data do I need, in what formats, from what sources?”',
      '“Does the model meet the accuracy bar?”',
      '“How will stakeholders consume the results?”',
      '“Why did the metric drop last month?”',
    ],
    correctIndex: 0,
    explanation:
      'Data Requirements is the shopping list: identifying the necessary content, formats, and sources before any data is actually collected.',
  },
  {
    id: 'm1-q10',
    prompt: '“What discount should we offer to maximize revenue?” is which type of analytics?',
    options: ['Prescriptive', 'Descriptive', 'Diagnostic', 'Predictive'],
    correctIndex: 0,
    explanation:
      'Prescriptive analytics recommends an action — it goes beyond predicting outcomes to optimizing the decision itself.',
  },
]
