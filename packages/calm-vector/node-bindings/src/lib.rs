#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use calm_vec::{CalmVec, encoder, metrics};

/// Main CALM Vector inference engine
#[napi]
pub struct Calm {
    inner: CalmVec,
    dim: usize,
}

#[napi]
impl Calm {
    /// Create a new untrained model
    #[napi(constructor)]
    pub fn new(dim: u32, hidden: u32) -> Result<Self> {
        let inner = CalmVec::new_untrained(dim as usize, hidden as usize)
            .map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(Self {
            inner,
            dim: dim as usize,
        })
    }

    /// Load model from serialized bytes
    #[napi(factory)]
    pub fn from_bytes(dim: u32, hidden: u32, bytes: Buffer) -> Result<Self> {
        let inner = CalmVec::from_bytes(dim as usize, hidden as usize, bytes.as_ref())
            .map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(Self {
            inner,
            dim: dim as usize,
        })
    }

    /// Encode text to vector
    #[napi]
    pub fn encode(&self, text: String) -> Vec<f32> {
        self.inner.encode(&text, self.dim)
    }

    /// Predict next vector
    #[napi]
    pub fn step(&self, z: Vec<f32>) -> Result<Vec<f32>> {
        self.inner
            .step(&z)
            .map_err(|e| Error::from_reason(e.to_string()))
    }

    /// Multi-step prediction
    #[napi]
    pub fn steps(&self, z: Vec<f32>, n: u32) -> Result<Vec<Vec<f32>>> {
        self.inner
            .steps(&z, n as usize)
            .map_err(|e| Error::from_reason(e.to_string()))
    }

    /// Get model dimension
    #[napi]
    pub fn get_dim(&self) -> u32 {
        self.dim as u32
    }
}

/// Compute cosine similarity between two vectors
#[napi]
pub fn cosine_similarity(a: Vec<f32>, b: Vec<f32>) -> Result<f32> {
    if a.len() != b.len() {
        return Err(Error::from_reason("Vectors must have same length"));
    }
    Ok(encoder::cosine_similarity(&a, &b))
}

/// Compute MSE between two vectors
#[napi]
pub fn mse(pred: Vec<f32>, target: Vec<f32>) -> Result<f32> {
    if pred.len() != target.len() {
        return Err(Error::from_reason("Vectors must have same length"));
    }
    Ok(metrics::mse_vec(&pred, &target))
}

/// Compute precision@k
#[napi]
pub fn precision_at_k(retrieved: Vec<String>, relevant: Vec<String>, k: u32) -> f32 {
    metrics::precision_at_k(&retrieved, &relevant, k as usize)
}

/// Compute recall@k
#[napi]
pub fn recall_at_k(retrieved: Vec<String>, relevant: Vec<String>, k: u32) -> f32 {
    metrics::recall_at_k(&retrieved, &relevant, k as usize)
}

/// Hash-based text encoding
#[napi]
pub fn hash_embed(text: String, dim: u32) -> Vec<f32> {
    encoder::hash_embed(&text, dim as usize)
}
