//! Text encoding using deterministic hashing for CPU-only vector generation

use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// Hash-based text encoder with signed buckets and L2 normalization
///
/// This provides a fast, deterministic CPU-only encoding without requiring
/// external embedding models. For production, replace with a proper encoder.
pub fn hash_embed(text: &str, dim: usize) -> Vec<f32> {
    let mut v = vec![0f32; dim];

    // Tokenize and hash each token into a bucket
    for tok in text.split_whitespace() {
        let mut h = DefaultHasher::new();
        tok.hash(&mut h);
        let idx = (h.finish() as usize) % dim;

        // Signed accumulation based on token characteristics
        let sign = if tok.len() % 2 == 0 { 1.0 } else { -1.0 };
        v[idx] += sign;
    }

    // L2 normalize to unit vector
    normalize_l2(&mut v);
    v
}

/// Normalize vector to unit length using L2 norm
fn normalize_l2(v: &mut [f32]) {
    let norm = (v.iter().map(|x| x * x).sum::<f32>()).sqrt().max(1e-6);
    for x in v.iter_mut() {
        *x /= norm;
    }
}

/// Compute cosine similarity between two vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a = (a.iter().map(|x| x * x).sum::<f32>()).sqrt();
    let norm_b = (b.iter().map(|x| x * x).sum::<f32>()).sqrt();
    dot / (norm_a * norm_b).max(1e-6)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic() {
        let v1 = hash_embed("test string", 128);
        let v2 = hash_embed("test string", 128);
        assert_eq!(v1, v2);
    }

    #[test]
    fn test_normalized() {
        let v = hash_embed("hello world", 128);
        let norm: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 1e-5);
    }

    #[test]
    fn test_cosine_self() {
        let v = hash_embed("test", 64);
        let sim = cosine_similarity(&v, &v);
        assert!((sim - 1.0).abs() < 1e-5);
    }

    #[test]
    fn test_different_embeddings() {
        let v1 = hash_embed("hello", 128);
        let v2 = hash_embed("world", 128);
        assert_ne!(v1, v2);
    }
}
