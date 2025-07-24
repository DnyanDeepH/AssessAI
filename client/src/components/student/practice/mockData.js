// Mock data for testing the practice session interface
export const mockQuestions = [
  {
    questionText: "What is the primary function of React's useEffect hook?",
    options: [
      "To create side effects in functional components",
      "To manage component state",
      "To optimize rendering performance",
      "To handle form submissions",
    ],
    correctAnswer: "To create side effects in functional components",
    topic: "React Hooks",
    explanation:
      "The useEffect hook allows you to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount in class components.",
  },
  {
    questionText: "Which of the following is NOT a valid HTTP status code?",
    options: [
      "200 OK",
      "404 Not Found",
      "503 Service Unavailable",
      "602 Server Error",
    ],
    correctAnswer: "602 Server Error",
    topic: "Web Development",
    explanation:
      "602 is not a standard HTTP status code. The valid HTTP status codes are grouped as follows: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), and 5xx (Server Error).",
  },
  {
    questionText: "In MongoDB, what is the purpose of an index?",
    options: [
      "To improve query performance",
      "To validate document structure",
      "To encrypt sensitive data",
      "To compress database size",
    ],
    correctAnswer: "To improve query performance",
    topic: "Databases",
    explanation:
      "Indexes in MongoDB support efficient execution of queries by creating small and efficient representations of the documents in a collection. Without indexes, MongoDB must scan every document in a collection to find matches to the query statement.",
  },
  {
    questionText:
      "Which JavaScript array method does NOT modify the original array?",
    options: ["push()", "splice()", "map()", "sort()"],
    correctAnswer: "map()",
    topic: "JavaScript",
    explanation:
      "The map() method creates a new array with the results of calling a provided function on every element in the calling array. It does not modify the original array, unlike push(), splice(), and sort() which all mutate the original array.",
  },
  {
    questionText:
      "What is the purpose of JWT (JSON Web Tokens) in authentication?",
    options: [
      "To securely transmit information between parties as a JSON object",
      "To encrypt database credentials",
      "To compress HTTP requests",
      "To validate HTML form inputs",
    ],
    correctAnswer:
      "To securely transmit information between parties as a JSON object",
    topic: "Authentication",
    explanation:
      "JWT (JSON Web Tokens) is an open standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.",
  },
];

// Mock API response format
export const mockApiResponse = {
  success: true,
  data: {
    questions: mockQuestions,
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "Mock Data",
      questionCount: mockQuestions.length,
    },
  },
};
