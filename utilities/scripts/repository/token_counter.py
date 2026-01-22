#!/usr/bin/env python3
import argparse
import sys
from transformers import AutoTokenizer, logging

# Suppress transformers warnings about tokenizers parallelism
logging.set_verbosity_error()

def count_and_optionally_output_tokens(file_path, model_name, output_tokens, no_special):
    """
    Counts tokens in a file using a specified tokenizer and optionally outputs them.

    Args:
        file_path (str): Path to the text file.
        model_name (str): Hugging Face model name for the tokenizer.
        output_tokens (bool): If True, print the tokenized output.
        no_special (bool): If True, exclude special tokens from the count and output.

    Returns:
        None: Prints output directly.
    """
    try:
        # Load the tokenizer for the specified model
        # use_fast=True is often faster, but fallback if needed
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
        except Exception:
             print(f"Warning: Could not load fast tokenizer for '{model_name}'. Trying slow version.", file=sys.stderr)
             tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)

        print(f"--- Using tokenizer: {model_name} ---", file=sys.stderr)

    except Exception as e:
        print(f"Error loading tokenizer for model '{model_name}': {e}", file=sys.stderr)
        print("Please check the model name, Hugging Face Hub connectivity, or required libraries.", file=sys.stderr)
        sys.exit(1)

    try:
        # Read the entire file content
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file '{file_path}': {e}", file=sys.stderr)
        sys.exit(1)

    # Tokenize the text
    # `add_special_tokens` is controlled by the `no_special` flag's inverse
    token_ids = tokenizer.encode(text, add_special_tokens=not no_special)
    token_count = len(token_ids)

    print(f"Token Count: {token_count}")

    if output_tokens:
        # Decode tokens for printing (more human-readable than IDs)
        # Using convert_ids_to_tokens provides a list of token strings
        tokens_list = tokenizer.convert_ids_to_tokens(token_ids)
        print("\n--- Tokens ---")
        # Print tokens separated by space for readability
        print(" ".join(tokens_list))
        print("--------------")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Count tokens in a text file using Hugging Face tokenizers.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s my_document.txt
  %(prog)s report.md -m bert-base-uncased
  %(prog)s code.py -m gpt2 -o
  %(prog)s data.txt --no-special-tokens
"""
    )

    parser.add_argument(
        "file_path",
        metavar="FILE",
        help="Path to the text file to tokenize."
    )
    parser.add_argument(
        "-m", "--model",
        default="gpt2",
        help="Hugging Face model name to specify the tokenizer (default: 'gpt2'). "
             "Examples: 'bert-base-uncased', 'roberta-base', 'google-bert/bert-base-uncased'."
    )
    parser.add_argument(
        "-o", "--output-tokens",
        action="store_true",
        help="Output the actual tokens (decoded strings) in addition to the count."
    )
    parser.add_argument(
        "--no-special-tokens",
        action="store_true",
        help="Exclude special tokens (like [CLS], [SEP], <|endoftext|>) from the count and output."
    )

    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()

    # Install necessary libraries if missing
    try:
        import transformers
    except ImportError:
        print("The 'transformers' library is required. Please install it:", file=sys.stderr)
        print("pip install transformers torch # or tensorflow", file=sys.stderr)
        sys.exit(1)

    count_and_optionally_output_tokens(
        args.file_path,
        args.model,
        args.output_tokens,
        args.no_special_tokens
    )

