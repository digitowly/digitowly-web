import { createSignal } from "solid-js";

export function ContactForm() {
  const [email, setEmail] = createSignal("meeep");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    console.info({
      email: email(),
    });
  };

  return (
    <form class="text-white" onSubmit={handleSubmit}>
      <input
        type="text"
        value={email()}
        onInput={(e) => setEmail(e.target.value)}
      />
      <button>submit</button>
    </form>
  );
}
