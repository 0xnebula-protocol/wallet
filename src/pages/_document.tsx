import Document, { Html, Head, Main, NextScript } from "next/document";

class ViemPasskeysDemo extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" type="image/png" href="/favicon.png" />
          <title>nebula wallet</title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default ViemPasskeysDemo;
